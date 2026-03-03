
// Advanced Ice Cream Formulation Logic (Matrix Solver - JS Version)
// Inputs: target_fat (%), target_prot (%), batch_size (g)
// Ingredients: Cream (40% F, 2.1% P), Milk (3.5% F, 3.4% P), MPC85 (1.5% F, 85% P)

// Helper: 3x3 Determinant
function det3(m) {
    return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]));
}

// Helper: Replace column for Cramer's Rule
function replaceCol(m, c, b) {
    const r = m.map(row => [...row]);
    for (let i = 0; i < 3; i++) {
        r[i][c] = b[i];
    }
    return r;
}

const items = $input.all();
const output = [];

for (const item of items) {
    const data = item.json;
    const targetFat = parseFloat(data.target_fat || 16);
    const targetProt = parseFloat(data.target_protein || 4.0);
    const batchSize = parseFloat(data.batch_size || 1000);

    // Fixed Solids
    const mSucrose = batchSize * 0.12;
    const mBrownSugar = batchSize * 0.03;
    const mStab = batchSize * 0.005;
    const mSolidsFixed = mSucrose + mBrownSugar + mStab;
    const mAvailable = batchSize - mSolidsFixed;

    const mFatTarget = batchSize * (targetFat / 100.0);
    const mProtTarget = batchSize * (targetProt / 100.0);

    // Matrix A coeffs
    // Mc, Mm, Mmpc
    // Eq 1: 1, 1, 1 (Mass)
    // Eq 2: 0.40, 0.035, 0.015 (Fat)
    // Eq 3: 0.021, 0.034, 0.85 (Prot)

    const A = [
        [1.0, 1.0, 1.0],
        [0.40, 0.035, 0.015],
        [0.021, 0.034, 0.85]
    ];

    const B = [mAvailable, mFatTarget, mProtTarget];

    const D = det3(A);

    if (Math.abs(D) < 1e-9) {
        output.push({ json: { status: "error", message: "Solver failed" } });
        continue;
    }

    const Mc = det3(replaceCol(A, 0, B)) / D;
    const Mm = det3(replaceCol(A, 1, B)) / D;
    const Mmpc = det3(replaceCol(A, 2, B)) / D;

    const recipe = {
        "Heavy Cream (40%)": parseFloat(Mc.toFixed(1)),
        "Whole Milk": parseFloat(Mm.toFixed(1)),
        "Milk Protein Conc. (85%)": parseFloat(Mmpc.toFixed(1)),
        "Cane Sugar": parseFloat(mSucrose.toFixed(1)),
        "Brown Sugar": parseFloat(mBrownSugar.toFixed(1)),
        "Stabilizer (Guar/LBG)": parseFloat(mStab.toFixed(1))
    };

    output.push({
        json: {
            status: "success",
            recipe: recipe,
            targets: { fat: targetFat, protein: targetProt }
        }
    });
}

return output;
