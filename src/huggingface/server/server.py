from quart import Quart, request, jsonify
from models.qwen import QwenModel

app = Quart(__name__)
app.config['model'] = None

@app.route('/initialize', methods=['POST'])
async def initialize():
    if app.config['model'] is not None:
        return jsonify({"message": "Model already loaded."})
    
    data = await request.json
    model_name = data['model_name']
    if "qwen" in model_name.lower():
        model = QwenModel(model_name)
    else:
        return jsonify({"message": "Model not found."})
    await model.load()
    app.config['model'] = model
    return jsonify({"message": "Model loaded."})

@app.route('/generate', methods=['POST'])
async def generate():
    model = app.config['model']
    if model is None:
        return jsonify({"message": "Model not loaded."})
    data = await request.get_json()
    response = await model.run(data)
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='localhost', port=5000)