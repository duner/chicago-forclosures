import csv

with open('20150512_Woodstock_data', 'rb') as csvfile:
  with open('woodstock_cleaned', 'w') as f:

    reader = csv.reader(csvfile)
    writer = csv.writer(f)

    writer.writerow(['cca', 'forclosures_per_thousand_homes'])

    for row in spamreader:
