import json

def load_ingredients():
    try:
        with open("ingredients.json", "r") as f:
            return json.dumps(json.load(f))
    except FileNotFoundError:
        return "[]"

def create_ice_cream_rd_workflow():
    ingredients_json_str = load_ingredients()
    
    # JavaScript Logic for Master Formulator (V4)
    code_js = """
const inputs = $input.all();
const item = inputs[0]; 
const params = item.json.body || item.json;
const targetFat = parseFloat(params.target_fat || 16);
const targetProt = parseFloat(params.target_protein || 10);
const batchSize = parseFloat(params.batch_size || 1000);
const recipeId = params.recipe_id || "mock_recipal_id_99";

const INGREDIENTS = """ + ingredients_json_str + """;

function det3(m) {
  return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
          m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
          m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]));
}

function replaceCol(m, c, b) {
  const r = m.map(row => [...row]);
  for (let i = 0; i < 3; i++) { r[i][c] = b[i]; }
  return r;
}

const P_fat_c = 40.0; const P_prot_c = 2.1;
const P_fat_m = 3.5;  const P_prot_m = 3.4;
const P_fat_mpc = 2.0; const P_prot_mpc = 85.0;

const mSucrose = batchSize * 0.12;
const mBrownSugar = batchSize * 0.03;
const mStab = batchSize * 0.005;
const mFixed = mSucrose + mBrownSugar + mStab;
const mAvailable = batchSize - mFixed;

const mFatTarget = batchSize * (targetFat / 100.0);
const mProtTarget = batchSize * (targetProt / 100.0);

const A = [
    [1.0, 1.0, 1.0],
    [P_fat_c/100, P_fat_m/100, P_fat_mpc/100],
    [P_prot_c/100, P_prot_m/100, P_prot_mpc/100]
];
const B = [mAvailable, mFatTarget, mProtTarget];
const D = det3(A);

if (Math.abs(D) < 1e-9) return [{json: {status: "error"}}];

const Mc = det3(replaceCol(A, 0, B)) / D;
const Mm = det3(replaceCol(A, 1, B)) / D;
const Mmpc = det3(replaceCol(A, 2, B)) / D;

return [{json: {
    status: "success",
    recipe_id: recipeId,
    recipe: {
        "Heavy Cream (40%)": parseFloat(Mc.toFixed(1)),
        "Whole Milk": parseFloat(Mm.toFixed(1)),
        "Milk Protein Conc. (85%)": parseFloat(Mmpc.toFixed(1)),
        "Cane Sugar": parseFloat(mSucrose.toFixed(1)),
        "Brown Sugar": parseFloat(mBrownSugar.toFixed(1)),
        "Stabilizer": parseFloat(mStab.toFixed(1))
    }
}}];
"""

    workflow = {
        "name": "Ice Cream R&D",
        "nodes": [
            {
                "parameters": {
                    "httpMethod": "POST",
                    "path": "formulate",
                    "responseMode": "lastNode",
                    "options": {}
                },
                "name": "Webhook",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [460, 460],
                "webhookId": "formulation-engine-webhook"
            },
            {
                "parameters": { "jsCode": "return $input.all();" },
                "name": "Data Extraction",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [680, 460]
            },
            {
                "parameters": { "jsCode": code_js },
                "name": "Master Formulator",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [900, 460]
            },
            {
                "parameters": {
                    "method": "POST",
                    "url": "https://www.recipal.com/api/v1/labels/render",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "httpHeaderAuth",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "Authorization",
                                "value": "Token 07300c3d005faf10b01a9103ca2fd0b1" 
                            }
                        ]
                    },
                    "sendBody": True,
                    "bodyParameters": {
                        "parameters": [
                            {
                                "name": "recipe_id",
                                "value": "={{ $json.recipe_id }}"
                            },
                            {
                                "name": "format",
                                "value": "png"
                            },
                            {
                                "name": "language",
                                "value": "en-US"
                            }
                        ]
                    },
                    "responseFormat": "file",
                    "options": {}
                },
                "name": "ReciPal Label Generator",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [1120, 460],
                "continueOnFail": True
            },
            {
                "parameters": {
                    "resource": "file",
                    "operation": "create",
                    "name": "={{ 'Loki_Report_' + new Date().toISOString() }}",
                    "parents": ["1zXiHNYNEfLTJvwinwqmu9nqtKCSd4n_w"], 
                    "content": "={{ '# Loki R&D Report\\n\\nMade by Antigravity\\n\\n' + JSON.stringify($('Master Formulator').item.json.recipe, null, 2) }}",
                    "mimeType": "application/vnd.google-apps.document",
                    "options": {}
                },
                "name": "Save to Drive",
                "type": "n8n-nodes-base.googleDrive",
                "typeVersion": 2,
                "position": [1340, 460],
                "credentials": {
                    "googleDriveOAuth2Api": {
                        "id": "6",
                        "name": "Google Drive Account 6"
                    }
                }
            }
        ],
        "connections": {
            "Webhook": { "main": [[{"node": "Data Extraction", "type": "main", "index": 0}]] },
            "Data Extraction": { "main": [[{"node": "Master Formulator", "type": "main", "index": 0}]] },
            "Master Formulator": { "main": [[{"node": "ReciPal Label Generator", "type": "main", "index": 0}]] },
            "ReciPal Label Generator": { "main": [[{"node": "Save to Drive", "type": "main", "index": 0}]] }
        },
        "settings": {"executionOrder": "v1"}
    }
    return workflow

if __name__ == "__main__":
    wf = create_ice_cream_rd_workflow()
    with open("ice_cream_rd.json", "w") as f:
        json.dump(wf, f, indent=2)
    print("Workflow generated: ice_cream_rd.json")
