const fs = require('fs');
const axios = require('axios');

const modelling_file_name = '.difffusion/json/modelling.json';
fs.readFile(modelling_file_name, 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const modellingData = JSON.parse(data);
    modellingData.forEach(obj => {
        axios.post(
            'http://localhost:2024/api/v1/ops',
            obj,
            {
                headers: { 'alias': obj.alias, 'op': 'BUILD' }
            }
        )
        .then(resp => {
            console.log(resp.data);
        })
        .catch(error => {
            console.error(error);
        });
    });
});

const simulation_file_name = '.difffusion/json/simulation.json';
fs.readFile(simulation_file_name, 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const simulationData = JSON.parse(data);
    Object.keys(simulationData).forEach(key => {
        axios.post(
            'http://localhost:2024/api/v1/ops',
            simulationData[key],
            {
                headers: { 'alias': key, 'op': 'BUILD' }
            }
        )
        .then(resp => {
            console.log(resp.data);
        })
        .catch(error => {
            console.error(error);
        });
    });
});

axios.get(
    'http://localhost:2024/api/v1/ops',
    {
        headers: { 'alias': 'cube/all_legs', 'op': 'BUILD' }
    }
)
.then(resp => {
    console.log(Object.keys(resp.data));
    const out_file_name = '.difffusion/cube.json';
    fs.writeFile(out_file_name, JSON.stringify(resp.data, null, 4), 'utf-8', (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('File saved successfully');
    });
})
.catch(error => {
    console.error(error);
});

