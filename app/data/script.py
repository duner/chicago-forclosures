import csv
import os

woodstock_ids = []
cca_ids = []

not_ccas = ['DuPage', 'COMMUNITY', 'Kane', 'Lake', 'McHenry',
            'North Cook', 'Northwest Cook', 'South Cook',
            'Southwest Cook', 'West Cook', 'Will']

with open('20150512_woodstock_data.csv', 'r') as csvfile:
    with open('woodstock_cleaned.csv', 'w') as f:

        reader = csv.reader(csvfile, delimiter='\t')
        writer = csv.writer(f)

        writer.writerow(['cca', 'filings', 'auctions', 'COMMUNITY'])

        first_line = False

        for i, row in enumerate(reader):
            if (i % 2) != 0:
                first_line = row
            elif i != 0 and (i % 2) == 0 and row[0] not in not_ccas:

                _area = row[0]
                _type = row[1]
                _filings = first_line[3]
                _auctions = row[3]

                if _area == 'East Garfield':
                    _area = 'East Garfield Park'
                if _area == 'Calumet Height':
                    _area = 'Calumet Heights'
                if _area == 'Grand Boulevar':
                    _area = 'Grand Boulevard'
                if _area == 'Greater Grand':
                    _area = 'Greater Grand Crossing'
                if _area == 'Lower West Sid':
                    _area = 'Lower West Side'
                if _area == 'Lakeview':
                    _area = 'Lake View'
                if _area == 'Mount Greenwoo':
                    _area = 'Mount Greenwood'
                if _area == 'Near North Sid':
                    _area = 'Near North Side'
                if _area == 'Near South Sid':
                    _area = 'Near South Side'
                if _area == "O'Hare":
                    _area = 'Ohare'
                if _area == 'Washingon Park':
                    _area = 'Washington Park'
                if _area == 'Washington Hei':
                    _area = 'Washington Heights'
                if _area == 'West Garfield':
                    _area = 'West Garfield Park'

                _id = _area.upper()

                if _area == 'Loop':
                    _area = 'The Loop'
                if _area == 'Ohare':
                    _area = "O'Hare"

                writer.writerow([_area, _filings, _auctions, _id])


command = 'topojson --properties --simplify-proportion .02 -e woodstock_cleaned.csv --id-property COMMUNITY -o cca.topojson cca.geojson'
os.system(command)
