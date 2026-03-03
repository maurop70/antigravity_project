import json

def solve_mix(target_fat, target_prot, batch_size=1000):
    # Targets (in grams)
    # Sugars: 15% (12% Sucrose, 3% Brown Sugar)
    # Stabilizer: 0.5%
    m_sucrose = batch_size * 0.12
    m_brown_sugar = batch_size * 0.03
    m_stab = batch_size * 0.005
    
    m_solids_fixed = m_sucrose + m_brown_sugar + m_stab
    m_available = batch_size - m_solids_fixed
    
    m_fat_target = batch_size * (target_fat / 100.0)
    m_prot_target = batch_size * (target_prot / 100.0)
    
    # Ingredient Composition
    # Cream: 40% Fat, 2.1% Prot
    # Milk: 3.5% Fat, 3.4% Prot
    # MPC85: 1.5% Fat, 85% Prot
    
    # System of Equations: Ax = B
    # x = [Mc, Mm, Mmpc]
    # Row 1: Mc + Mm + Mmpc = m_available
    # Row 2: 0.40*Mc + 0.035*Mm + 0.015*Mmpc = m_fat_target
    # Row 3: 0.021*Mc + 0.034*Mm + 0.85*Mmpc = m_prot_target
    
    A = [
        [1.0, 1.0, 1.0],
        [0.40, 0.035, 0.015],
        [0.021, 0.034, 0.85]
    ]
    
    B = [m_available, m_fat_target, m_prot_target]
    
    def determinant_3x3(m):
        return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
                m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
                m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))

    det_A = determinant_3x3(A)
    
    if det_A == 0:
        return "No unique solution found"
    
    # Cramer's Rule
    def copy_matrix(m):
        return [row[:] for row in m]
        
    def replace_col(m, col_idx, b):
        new_m = copy_matrix(m)
        for i in range(3):
            new_m[i][col_idx] = b[i]
        return new_m
        
    det_x = determinant_3x3(replace_col(A, 0, B))
    det_y = determinant_3x3(replace_col(A, 1, B))
    det_z = determinant_3x3(replace_col(A, 2, B))
    
    Mc = det_x / det_A
    Mm = det_y / det_A
    Mmpc = det_z / det_A
    
    results = {
        "Heavy Cream (40%)": round(Mc, 2),
        "Whole Milk": round(Mm, 2),
        "Milk Protein Concentrate (85%)": round(Mmpc, 2),
        "Cane Sugar": round(m_sucrose, 2),
        "Brown Sugar": round(m_brown_sugar, 2),
        "Stabilizer": round(m_stab, 2),
        "Total Mass": round(Mc + Mm + Mmpc + m_solids_fixed, 2)
    }
    
    # Validation Check
    calc_fat = (Mc*0.40 + Mm*0.035 + Mmpc*0.015) / batch_size * 100
    calc_prot = (Mc*0.021 + Mm*0.034 + Mmpc*0.85) / batch_size * 100
    
    return results, calc_fat, calc_prot

# Test with Loki's Request
print("Testing Solver for: 12% Fat, 10% Protein")
res, f, p = solve_mix(12, 10, 1000)
print(json.dumps(res, indent=2))
print(f"Calculated Fat: {f:.2f}%")
print(f"Calculated Prot: {p:.2f}%")
