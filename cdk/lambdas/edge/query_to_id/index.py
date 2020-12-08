from urllib.parse import parse_qs
from geo import id_from_lat_long

possible_paths = {'/visible'}

def handler(event: dict, context: dict):
    request = event['Records'][0]['cf']['request']
    uri = request['uri']
    querystring = request['querystring']

    if not uri in possible_paths:
        return { 'statusCode': 404 }

    query_params = { k: float(v[0]) for k, v in parse_qs(querystring).items() }

    if 'lat' in query_params and 'long' in query_params:
        lat_long_id = id_from_lat_long(query_params['lat'], query_params['long'])
        request['uri'] = request['uri'] + '/' + lat_long_id
    elif 'postcode' in query_params:
        # get lat/lon
        # convert to id
        return
    else:
        return { 'statusCode': 400, 'message': 'You must provide a lat and lon or a postcode.' }

    return request