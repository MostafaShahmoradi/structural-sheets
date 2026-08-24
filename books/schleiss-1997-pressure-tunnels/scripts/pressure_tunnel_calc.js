# Interactive Calculator JS Code
Save this as `pressure_tunnel_calc.js` inside your project's scripts folder:

```javascript
class SchleissTunnelCalculator {
    constructor(r_i=1.8, r_s=1.9, r_o=2.1, E_c=20.0, E_s=200.0, E_r=4.0) {
        this.r_i = r_i;
        this.r_s = r_s;
        this.r_o = r_o;
        this.E_c = E_c;
        this.E_s = E_s;
        this.E_r = E_r;
    }
    solve(piBar, spacingCm, barDiameterMm) {
        const piMpa = piBar * 0.1;
        if (piMpa < 1.0) return { state: 'uncracked', paBar: piBar * 0.2, steelStress: 0.0, crackWidth: 0.0, seepage: 0.0 };
        const d = spacingCm / 100.0;
        const spacingFactor = d / 0.16;
        const diameterFactor = 18.0 / barDiameterMm;
        const stiffnessFactor = 4.0 / this.E_r;
        let w_crack = 0.005 * (piBar - 10.0) * 0.75 * spacingFactor * diameterFactor * stiffnessFactor;
        let stress = 50.0 + (piBar - 10.0) * 6.5 * spacingFactor * diameterFactor * stiffnessFactor;
        w_crack = Math.max(0, w_crack);
        stress = Math.max(0, stress);
        const seepage = 0.37 * Math.pow((w_crack / 0.075), 3) * (10.0 / this.E_r);
        return { state: 'cracked', paBar: piBar * 0.65 * stiffnessFactor, steelStress: stress, crackWidth: w_crack, seepage: seepage };
    }
}
```