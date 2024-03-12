from collections import OrderedDict
import gzip
from io import BytesIO
import json
from bson import ObjectId
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from pymongo import MongoClient
import os
import shutil
import plotly.graph_objs as go

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://10.11.30.239:27017/')
db = client['test7']

client2= MongoClient('mongodb://10.11.30.239:27017')
db2 =client2['LOH']

# Create a temporary folde if it doesn't exist
TEMP_FOLDER = 'tmp'
if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    # Dummy login logic for testing
    if username == 'gautham' and password == 'gautham@123':
        print('Login successful for user:', username)
        return jsonify({'message': 'Login successful'}), 200
    else:
        print('Login failed for user:', username)
        return jsonify({'message': 'Invalid credentials'}), 401


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
                # Parse through the directory and process files
                parse_through(file.filename)
            else:
                # Process individual files
                process_file(file)

        return jsonify({'message': 'Files added to the database successfully.'})
    else:
        return jsonify({'error': 'No files received'})



def process_file(file):
    if file.filename.endswith('.gz'):
        try:
            # Extract the gzipped file
            extracted_vcf_file = extract_vcf_from_gz(file)
            if extracted_vcf_file:
                # Create a collection for the extracted VCF file
                collection_name = os.path.splitext(os.path.splitext(file.filename)[0])[0]
                user_collection = db[collection_name]
                process_and_insert_vcf(extracted_vcf_file, user_collection)
            else:
                return jsonify({'error': 'Failed to extract VCF file from gzipped file.'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        # Create a collection for the individual file
        collection_name = os.path.splitext(file.filename)[0]
        user_collection = db[collection_name]
        process_and_insert_vcf(file, user_collection)

def extract_vcf_from_gz(gzipped_file):
    try:
        # Create a temporary directory to extract the file
        temp_dir = 'temp'
        os.makedirs(temp_dir, exist_ok=True)

        # Specify the full path for the extracted VCF file
        extracted_vcf_file_path = os.path.join(temp_dir, os.path.splitext(gzipped_file.filename)[0])

        # Decompress the gzipped file
        with gzip.open(gzipped_file, 'rb') as f_in:
            with open(extracted_vcf_file_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        return open(extracted_vcf_file_path, 'rb')
    except Exception as e:
        raise Exception('Failed to extract VCF file from gzipped file.') from e



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

        values_set = create_values_set('/DATA/IHDB_CNV/interface/backend/output.json')

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
                end = int(document.get("INFO",{}).get("END", 0))
                chr_value = str(document.get("Chromosome", ""))
                alt = document.get("ALT", "")
                GeneList = document.get("FORMAT",{}).get("GeneList", "")
                CriticalGeneList = document.get("FORMAT",{}).get("CriticalGeneList", "")

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

        return jsonify({'messa</div>ge': f'Collection {collection_name} deleted successfully'}), 200

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

            elif A >= position and B  is not None and end is not None and B <= end and C == chr:
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
            elif A is not None and position is not None and B is not None and end is not None and A > position and B > end and end > A and C == chr:
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

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)


@app.route('/get_matched_data_graph', methods=['POST'])
def get_matched_data_graph():
    data = request.get_json()
    A, B, C, E = int(data.get('start', 0)), int(data.get('end', 0)), data.get('chromosome', ''), data.get('duplication_deletion', '')

    traces = []  # Initialize traces list

    for collection_name in db.list_collection_names():
        collection = db[collection_name]

        for document in collection.find():
            position = int(document.get("Position", 0))
            end = int(document.get("INFO", {}).get("END", 0))
            alt = str(document.get("ALT", ""))
            chr_value = str(document.get("Chromosome", ""))

            # Example conditions, adjust as needed
            if A == position and B == end and C == chr_value:
                traces.append((position, end, collection_name, alt))

            elif A <= position <= B and C == chr_value:
                traces.append((position, end, collection_name, alt))

            elif A < position and B > end and C == chr_value:
                traces.append((position, end, collection_name, alt))

            # Add more conditions based on your requirements...

    if traces:
        graph_data = create_graph(traces)  # Pass traces to create_graph function
        graph_image = plot_to_image(graph_data)
        return send_file(graph_image, mimetype='image/png', as_attachment=True, download_name='graph.png')
    else:
        return jsonify({"message": "No matched documents for graph"})

def create_graph(traces):
    data = []  # Initialize data list
    y_values = []  # Store unique y values for each collection name

    for i, (position, end, collection_name, alt) in enumerate(traces):
        # Use the collection name as the y value
        y_value = f'{i + 1}. {collection_name}'
        if y_value not in y_values:
            y_values.append(y_value)

        # Determine line color based on alt value
        line_color = 'blue' if alt == '<DUP>' else 'red'

        # Create a horizontal line (bar) for each entry
        trace = go.Scatter(
            x=[position, end],
            y=[i + 1, i + 1],  # Use the index as the y value
            mode='lines',  # Display as a line without text
            line=dict(color=line_color, width=5),  # Adjust color and width as needed
            hoverinfo='text',
            text=f'Collection: {collection_name}<br>Position: {position}<br>End: {end}<br>Alt: {alt}',
            name=f'Sleeping Line: {position} to {end}',
        )

        data.append(trace)

    # Find the minimum and maximum values for position and end
    min_position = min(trace[0] for trace in traces)
    max_end = max(trace[1] for trace in traces)

    # Extend the x-axis range by adding extra space
    xaxis_range = [min_position - 1000, max_end + 1000]

    # Dynamically set the height of the graph based on the number of traces
    graph_height = max(300, len(traces) * 40)  # Minimum height of 300, increase as needed

    layout = go.Layout(
        title='CNV Visualiser',
        xaxis=dict(title='Position to End Range', range=xaxis_range),
        yaxis=dict(title='Collection', tickvals=list(range(1, len(y_values) + 1)), ticktext=y_values),
        showlegend=False,  # Do not display legend for individual lines
        hovermode='closest',  # Display hover information for the closest point
        height=graph_height,  # Set the height dynamically
        margin=dict(l=50, r=50, b=50, t=50),  # Adjust margins as needed
    )

    graph_data = {'data': data, 'layout': layout}
    return graph_data


def plot_to_image(graph_data):
    # Convert plotly graph data to an image
    img_bytes = BytesIO()
    fig = go.Figure(graph_data)
    fig.write_image(img_bytes, format='png')
    img_bytes.seek(0)
    return img_bytes



@app.route('/check_overlappingL', methods=['POST'])
def check_overlapping():
    try:
        user_input = request.json.get('input_data').strip()  # Strip whitespaces from user_input
        total_matched_documents = 0
        matched_data = []

        for collection_name in db2.list_collection_names():
            collection = db2[collection_name]

            for document in collection.find():
                loh_info = document.get('LoH Info', {})
                region = loh_info.get('Region', '').strip()  # Access nested Region field and strip whitespaces
                if region == user_input:
                    total_matched_documents += 1
                    document_id = str(document.pop('_id', None))
                    row_data = {
                        "document_id": document_id,
                        "collection_name": collection_name,
                    }
                    row_data.update({f"{key}": value for key, value in document.items()})
                    matched_data.append(row_data)

        # Add the total number of matched documents across all collections to the result data
        result_data = {
            'matched_data': matched_data,
            'total_matched_documents': total_matched_documents
        }

        return jsonify(result_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/count_collections', methods=['GET'])
def count_collections():
    collections = db.list_collection_names()
    count = len(collections)
    return jsonify({'count': count})

@app.route('/list_collections', methods=['GET'])
def list_collections():
    collections = db.list_collection_names()
    return jsonify({'collections': collections})

@app.route('/count_del_dup', methods=['GET'])
def count_del_dup():
    selected_collection = request.args.get('collection')
    if selected_collection and selected_collection != 'All':
        collection = db[selected_collection]
        del_count = collection.count_documents({'ALT': '<DEL>'})
        dup_count = collection.count_documents({'ALT': '<DUP>'})
    else:
        del_count = 0
        dup_count = 0
        for collection_name in db.list_collection_names():
            collection = db[collection_name]
            del_count += collection.count_documents({'ALT': '<DEL>'})
            dup_count += collection.count_documents({'ALT': '<DUP>'})
    return jsonify({'delCount': del_count, 'dupCount': dup_count})

@app.route('/count_classification', methods=['GET'])
def count_classification():
    try:
        collection_name = request.args.get('collection')
        count_vus = 0
        count_benign = 0
        count_likely_benign = 0
        count_likely_pathogenic = 0
        count_pathogenic = 0

        if collection_name and collection_name != 'All':
            count_vus = db[collection_name].count_documents({"FORMAT.Classification": "VUS"})
            count_benign = db[collection_name].count_documents({"FORMAT.Classification": "Benign"})
            count_likely_benign = db[collection_name].count_documents({"FORMAT.Classification": "Likely Benign"})
            count_likely_pathogenic = db[collection_name].count_documents({"FORMAT.Classification": "Likely Pathogenic"})
            count_pathogenic = db[collection_name].count_documents({"FORMAT.Classification": "Pathogenic"})
        else:
            count_vus = 0
            count_benign = 0
            count_likely_benign = 0
            count_likely_pathogenic = 0
            count_pathogenic = 0
            for collection in db.list_collection_names():
                count_vus += db[collection].count_documents({"FORMAT.Classification": "VUS"})
                count_benign += db[collection].count_documents({"FORMAT.Classification": "Benign"})
                count_likely_benign += db[collection].count_documents({"FORMAT.Classification": "Likely Benign"})
                count_likely_pathogenic += db[collection].count_documents({"FORMAT.Classification": "Likely Pathogenic"})
                count_pathogenic += db[collection].count_documents({"FORMAT.Classification": "Pathogenic"})

        return jsonify({'vusCount': count_vus, 'benignCount': count_benign, 'likelyBenignCount': count_likely_benign,
                        'likelyPathogenic': count_likely_pathogenic, 'pathogenic': count_pathogenic})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/count_collections_in_region', methods=['GET'])
def count_collections_in_region():
    try:
        min_region = float(request.args.get('minRegion'))
        max_region = float(request.args.get('maxRegion'))

        count = 0
        for collection_name in db.list_collection_names():
            collection = db[collection_name]
            for document in collection.find():
                format_data = document.get("FORMAT", {})
                avg_z_score = format_data.get("AvgZScore", None)
                if avg_z_score is not None and min_region <= avg_z_score <= max_region:
                    count += 1

        return jsonify({'count': count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/adjust_values', methods=['POST'])
def adjust_values():
    data = request.json
    min_value = max(-10, data['min'])
    max_value = min(10, data['max'])

    total_count = 0
    collections_with_data = []

    # Iterate through all collections
    for collection_name in db.list_collection_names():
        collection = db[collection_name]
        collection_has_data = False
        # Iterate through all documents in the collection
        for document in collection.find({}):
            avg_zscore = float(document.get('FORMAT', {}).get('AvgZScore'))
            if avg_zscore is not None and min_value <= avg_zscore <= max_value:
                collection_has_data = True
                break  # Break out of the loop if at least one document satisfies the condition
        if collection_has_data:
            total_count += 1
            collections_with_data.append(collection_name)

    return jsonify({'count': total_count, 'collections_with_data': collections_with_data})

@app.route('/adjust_span', methods=['POST'])
def adjust_span():
    data = request.json
    min_value = max(-50000, data['min'])
    max_value = min(50000, data['max'])

    total_count_span = 0
    collections_with_data_span = []

    # Iterate through all collections
    for collection_name in db.list_collection_names():
        collection = db[collection_name]
        collection_has_data = False
        # Iterate through all documents in the collection
        for document in collection.find({}):
            span = float(document.get('INFO', {}).get('Span'))
            if span is not None and min_value <= span <= max_value:
                collection_has_data = True
                break  # Break out of the loop if at least one document satisfies the condition
        if collection_has_data:
            total_count_span += 1
            collections_with_data_span.append(collection_name)

    return jsonify({'countspan': total_count_span, 'collections_with_data_span': collections_with_data_span})


@app.route('/get_data_for_excel', methods=['GET'])
def get_data_for_excel():
    collection_names = db.list_collection_names()
    data = []

    for collection_name in collection_names:
        collection = db[collection_name]
        documents = collection.find()

        for document in documents:
            info = document.get('INFO', {})
            format = document.get('FORMAT', {})

            row = OrderedDict([
            ('Chromosome', document.get('Chromosome')),
            ('Start', document.get('Position')),
            ('Stop', info.get('END')),
            ('Type', info.get('Type')),
            ('Sample Name', collection_name),
            ('CNV State', format.get('CNVState')),
            ('Flags', format.get('Flags2')),
            ('Avg Target Mean Depth', format.get('AvgTargetMeanDepth')),
            ('Avg Z Score', format.get('AvgZScore')),
            ('Avg Ratio', format.get('AvgRatio')),
            ('P-Value', format.get('pvalue')),
            ('Karyotype', format.get('Karyotype'))
            ])


            data.append(row)

    return jsonify(data)



if __name__ == '__main__':
    app.run(host='10.11.30.239',port=5000)
