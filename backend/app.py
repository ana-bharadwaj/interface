import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from pymongo import MongoClient
import os
import shutil

app = Flask(__name__)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client['test7']

client2= MongoClient('mongodb://localhost:27017')
db2 =client2['LOH']

# Create a temporary folde if it doesn't exist
TEMP_FOLDER = 'tmp'
if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)


@app.route('/get_collections', methods=['GET'])
def get_collections():
    collections = db.list_collection_names()
    return jsonify({'collections': collections})

@app.route('/drop_collection', methods=['POST'])
def drop_collection():
    collection_name = request.json.get('collection')
    if collection_name:
        db[collection_name].drop()
        return jsonify({'message': f'Collection "{collection_name}" dropped successfully.'})
    else:
        return jsonify({'error': 'Invalid request. Please provide a collection name.'})

@app.route('/add_file', methods=['POST'])
def add_file():
    files = request.files.getlist('files')

    if files:
        for file in files:
            # Check if the file is a directory
            if os.path.isdir(file.filename):
                # Create a collection for each file within the directory
                parse_through(file)
            else:
                # Create a collection for the individual file
                collection_name = os.path.splitext(file.filename)[0]
                user_collection = db[collection_name]
                process_and_insert_vcf(file, user_collection)

        return jsonify({'message': 'Files added to the database successfully.'})
    else:
        return jsonify({'error': 'No files received'})
    
def create_values_set(json_filename):
    with open(json_filename, 'r') as json_file:
        json_data = json.load(json_file)
        values_list = json_data.get('values', [])
    return set(values_list)

def check_variable_in_json(variable, values_set):
    variable_strings = [v.strip() for v in variable.split(',')]
    return any(v in values_set for v in variable_strings)

@app.route('/process_data', methods=['POST'])
def process_data():
    if request.method == 'POST':
        data = request.json
        A, B, C, E = int(data.get('start', 0)), int(data.get('end', 0)), data.get('chromosome', ''), data.get('duplication_deletion', '')

        values_set = create_values_set('/home/humangenetics/apps/Interface/backend/output.json')

        collections = db.list_collection_names()

        matched_data_alt_e = []
        matched_data_alt_not_e = []
        total_match = 0
        matching_documents = []

        D = (B - A) * 0.15
        Lower = A - D
        Upper = B + D

        for collection_name in collections:
            collection = db[collection_name]

            for document in collection.find():
                position = int(document.get("Position", 0))
                end = int(document["INFO"].get("END", 0))
                chr_value = str(document.get("Chromosome", ""))
                alt = document.get("ALT", "")
                GeneList = document["FORMAT"].get("GeneList", "")
                CriticalGeneList = document["FORMAT"].get("CriticalGeneList", "")

                if CriticalGeneList and GeneList is not None:
                    if Lower <= position < Upper and Lower < end <= Upper and C == chr_value:
                        row_data = {
                            "document_id": str(document.pop('_id', None)),
                            "collection_name": collection_name,
                        }
                        row_data.update({f"{key}": value for key, value in document.items()})

                        if alt == E:
                            matched_data_alt_e.append(row_data)
                        else:
                            matched_data_alt_not_e.append(row_data)

                        if collection_name not in matching_documents:
                            total_match += 1
                else:
                    resultG = check_variable_in_json(GeneList, values_set)
                    resultC = check_variable_in_json(CriticalGeneList, values_set)
                    if resultC or resultG:
                        if Lower <= position < Upper and Lower < end <= Upper and C == chr_value:
                            row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                            row_data.update({f"{key}": value for key, value in document.items()})

                            if alt == E:
                                matched_data_alt_e.append(row_data)
                            else:
                                matched_data_alt_not_e.append(row_data)

                            if collection_name not in matching_documents:
                                total_match += 1
                        


        response_data = {
            'message': 'Data processed successfully',
            'total_match': total_match,
            'matched_data_alt_e': matched_data_alt_e,
            'matched_data_alt_not_e': matched_data_alt_not_e,
        }
        return jsonify(response_data)

def process_and_insert_vcf(file, collection):
    for line in file:
        # Decode each line from bytes to string
        line = line.decode('utf-8')

        # Skip header lines
        if line.startswith("#"):
            continue

        fields = line.strip().split("\t")
        chromosome, position, vcf_id, ref, alt, qual, filter_val, info, format_val, sample_data = fields

        # Create a dictionary for the main fields
        dataHead = {
            'Chromosome': chromosome,
            'Position': position,
            'ID': vcf_id,
            'REF': ref,
            'ALT': alt,
            'QUAL': qual,
            'FILTER': filter_val,
        }

        # Split the data into individual fields based on semicolon (;)
        info_fields = info.split(";")

        info_dict = {}
        for field in info_fields:
            if "=" in field:
                key, value = field.split("=")
                info_dict[key] = value
            else:
                info_dict[field] = None

        dataHead['INFO'] = info_dict

        # Split the "FORMAT" field
        format_fields = format_val.split(":")
        format_data = {field: value for field, value in zip(format_fields, sample_data.split(":"))}
        dataHead['FORMAT'] = format_data

        # Insert dataHead into the MongoDB collection
        collection.insert_one(dataHead)

def parse_through(folder):
    for file in os.listdir(folder.filename):
        if file.endswith(".vcf"):
            # Specify the full path to the VCF file
            vcf_file_path = os.path.join(folder.filename, file)

            # Create a collection with the same name as the VCF file (remove the ".vcf" extension)
            collection_name = os.path.splitext(file)[0]
            collection = db[collection_name]

            # Process and insert data from the VCF file into the database
            process_and_insert_vcf(vcf_file_path, collection)


@app.route('/upload_loh_data', methods=['POST'])
def upload_loh_data():
    try:
        # Get uploaded files
        files = request.files.getlist('files')

        for file in files:
            # Extract collection name from the file name (excluding extension)
            collection_name = os.path.splitext(file.filename)[0]

            # Create a collection for the current Excel file
            collection = db2[collection_name]

            # Read Excel file into a DataFrame
            df = pd.read_excel(file, header=[0, 1])

            # Iterate over rows in the DataFrame
            for _, row in df.iterrows():
                # Create a dictionary to store the document
                document = {}

                # Iterate over multi-index columns in the row
                for (main_heading, sub_heading), value in row.items():
                    # Check if the value is NaN (pandas representation for missing values)
                    if pd.notna(value):
                        # Create nested dictionaries for main and subheadings
                        if main_heading not in document:
                            document[main_heading] = {}
                        document[main_heading][sub_heading] = value

                # Insert the document into MongoDB
                collection.insert_one(document)

        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/get_collectionsLOH', methods=['GET'])
def get_collectionsLOH():
    try:
        # Get a list of all collections in the MongoDB database
        collections = db2.list_collection_names()

        return jsonify({'collections': collections}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_collection', methods=['POST'])
def delete_collection():
    try:
        # Get the collection name from the request
        data = request.get_json()
        collection_name = data.get('collection_name')

        # Delete the collection
        db2[collection_name].drop()

        return jsonify({'message': f'Collection {collection_name} deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_matched_data', methods=['POST'])
def get_matched_data():
    data = request.get_json()
    A, B, C, E = int(data.get('start', 0)), int(data.get('end', 0)), data.get('chromosome', ''), data.get('duplication_deletion', '')
   

    matched_data = []

    for collection_name in db.list_collection_names():
        collection = db[collection_name]

        for document in collection.find():
            position = int(document.get("Position", 0))
            end = int(document["INFO"].get("END", 0)) if "INFO" in document else None
            chr = str(document.get("Chromosome", ""))



            if A == position or A == end or B == position or B == end and C== chr:
                row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                row_data.update({f"{key}": value for key, value in document.items()})
                matched_data.append(row_data)
            
            elif A >= position and B <= end and C == chr:
                row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                row_data.update({f"{key}": value for key, value in document.items()})
                matched_data.append(row_data)
            elif A < position and B > end and C == chr:
                row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                row_data.update({f"{key}": value for key, value in document.items()})
                matched_data.append(row_data)
            elif A > position and B > end and end > A and C == chr:
                row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                row_data.update({f"{key}": value for key, value in document.items()})
                matched_data.append(row_data)
            elif A < position and B < end and  B > position and C == chr:
                row_data = {
                                "document_id": str(document.pop('_id', None)),
                                "collection_name": collection_name,
                            }
                row_data.update({f"{key}": value for key, value in document.items()})
                matched_data.append(row_data)
     

    return jsonify(matched_data)

@app.route('/check_overlappingL', methods=['POST'])
def check_overlapping():
    try:
        user_input = request.json.get('input_data')
        total_matched_documents = 0
        result_data = []

        for collection_name in db.list_collection_names():
            collection = db[collection_name]

            # Query the collection for documents matching the user input in the 'Region' field
            query = {"Region": user_input}
            matching_documents = collection.find(query)

            # Collect matching documents and display the number of matched documents for the current collection
            num_matched_documents = 0
            for document in matching_documents:
                num_matched_documents += 1
                total_matched_documents += 1
                document_data = {
                    'collection_name': collection_name,
                    'document': document
                }
                result_data.append(document_data)

            # Add the number of matched documents for the current collection to the result data
            result_data[-1]['num_matched_documents'] = num_matched_documents

        # Add the total number of matched documents across all collections to the result data
        result_data.append({'total_matched_documents': total_matched_documents})

        return jsonify(result_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500




if __name__ == '__main__':
    app.run(debug=True)