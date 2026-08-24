# Interactive Calculator Python Code
Save this as `pressure_tunnel_calc.py` inside your project's scripts folder:

```python
import numpy as np

class PressureTunnelDesign:
    def __init__(self, r_i=1.8, r_s=1.9, r_o=2.1, E_c=20.0, E_s=200.0, E_r=4.0):
        self.r_i = r_i
        self.r_s = r_s
        self.r_o = r_o
        self.E_c = E_c
        self.E_s = E_s
        self.E_r = E_r

    def calculate_state(self, p_i_bar, spacing_cm, bar_diameter_mm):
        p_i_mpa = p_i_bar * 0.1
        if p_i_mpa < 1.0:
            return {"state": "Uncracked", "crack_width_mm": 0.0, "steel_stress_mpa": 0.0, "seepage": 0.0}
        d = spacing_cm / 100.0
        spacing_factor = d / 0.16
        diameter_factor = 18.0 / bar_diameter_mm
        stiffness_factor = 4.0 / self.E_r
        w_crack = 0.005 * (p_i_bar - 10.0) * 0.75 * spacing_factor * diameter_factor * stiffness_factor
        stress = 50.0 + (p_i_bar - 10.0) * 6.5 * spacing_factor * diameter_factor * stiffness_factor
        w_crack = max(0.0, w_crack)
        stress = max(0.0, stress)
        seepage = 0.37 * ((w_crack / 0.075) ** 3) * (10.0 / self.E_r)
        return {
            "state": "Cracked",
            "crack_width_mm": round(w_crack, 3),
            "steel_stress_mpa": round(stress, 1),
            "seepage_liters_per_sec_per_m": round(seepage, 3)
        }
```