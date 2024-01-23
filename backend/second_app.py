# second_app.py

import os
import json
import pymongo

TEMP_FOLDER = 'tmp'

def get_temp_folder():
    return TEMP_FOLDER

def create_values_set(json_filename):
    with open(json_filename, 'r') as json_file:
        json_data = json.load(json_file)
        values_list = json_data.get('values', [])
    return set(values_list)

def check_variable_in_json(variable, values_set):
    variable_strings = [v.strip() for v in variable.split(',')]
    return any(v in values_set for v in variable_strings)

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
    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["test7"]

    for file in os.listdir(folder.filename):
        if file.endswith(".vcf"):
            # Specify the full path to the VCF file
            vcf_file_path = os.path.join(folder.filename, file)

            # Create a collection with the same name as the VCF file (remove the ".vcf" extension)
            collection_name = os.path.splitext(file)[0]
            collection = db[collection_name]

            # Process and insert data from the VCF file into the database
            process_and_insert_vcf(vcf_file_path, collection)

    client.close()
