from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import shutil

app = Flask(__name__)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client['test7']

# Create a temporary folder if it doesn't exist
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

if __name__ == '__main__':
    app.run(debug=True)