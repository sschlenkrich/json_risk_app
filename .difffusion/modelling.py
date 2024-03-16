import json
import requests

if __name__ == '__main__':
    modelling_file_name = '.difffusion/modelling.json'
    with open(modelling_file_name, "r") as f:
        data = json.load(f)
    # print(data)
    #
    for obj in data:
        resp = requests.post(
            'http://localhost:2024/api/v1/ops',
            headers={ 'alias' : obj['alias'], 'op' : 'BUILD' },
            data=json.dumps(obj),
            )
        print(resp.json())
    simulation_file_name = '.difffusion/simulation.json'
    with open(simulation_file_name, "r") as f:
        data = json.load(f)
    for key in data:
        resp = requests.post(
            'http://localhost:2024/api/v1/ops',
            headers={ 'alias' : key, 'op' : 'BUILD' },
            data=json.dumps(data[key]),
            )
        print(resp.json())
    #
    resp = requests.get(
        'http://localhost:2024/api/v1/ops',
        headers={ 'alias' : 'cube/all_legs', 'op' : 'BUILD' },
        )
    print(resp.json().keys())
    out_file_name = '.difffusion/cube.json'
    with open(out_file_name, 'w', encoding='utf-8') as f:
        json.dump(resp.json(), f, ensure_ascii=False, indent=4)
    #

    