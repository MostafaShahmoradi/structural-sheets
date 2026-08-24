// ACI 318-19 — Singly reinforced rectangular concrete beam, flexural design
// Units: b, d, h in mm | f'c, fy in MPa | Mu in kN·m

function beta1(fc) {
  if (fc <= 28) return 0.85;
  const b1 = 0.85 - 0.05 * ((fc - 28) / 7);
  return Math.max(b1, 0.65);
}

function fmt(n, digits = 1) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function calculate() {
  const b = parseFloat(document.getElementById('b').value);
  const d = parseFloat(document.getElementById('d').value);
  const h = parseFloat(document.getElementById('h').value);
  const fc = parseFloat(document.getElementById('fc').value);
  const fy = parseFloat(document.getElementById('fy').value);
  const MuInput = parseFloat(document.getElementById('mu').value);

  const results = document.getElementById('results');

  if ([b, d, h, fc, fy, MuInput].some(v => isNaN(v) || v <= 0)) {
    results.innerHTML = `<div class="note-box">لطفاً همه مقادیر را به‌صورت عدد مثبت وارد کنید.</div>`;
    return;
  }
  if (d >= h) {
    results.innerHTML = `<div class="note-box">ارتفاع مؤثر d باید کوچک‌تر از ارتفاع کل مقطع h باشد.</div>`;
    return;
  }

  const Mu = MuInput * 1e6; // kN·m -> N·mm
  const b1 = beta1(fc);

  // --- Iterative solution for phi (starts tension-controlled, phi = 0.9) ---
  let phi = 0.9;
  let As = 0, a = 0, c = 0, epsT = 0;
  let converged = true;

  for (let i = 0; i < 40; i++) {
    const Rn = Mu / (phi * b * d * d);
    const term = 1 - (2 * Rn) / (0.85 * fc);

    if (term < 0) {
      converged = false;
      break;
    }

    const rho = (0.85 * fc / fy) * (1 - Math.sqrt(term));
    As = rho * b * d;
    a = (As * fy) / (0.85 * fc * b);
    c = a / b1;
    epsT = 0.003 * (d - c) / c;

    let newPhi;
    if (epsT >= 0.005) newPhi = 0.9;
    else if (epsT <= 0.002) newPhi = 0.65;
    else newPhi = 0.65 + (epsT - 0.002) * (0.25 / 0.003);

    if (Math.abs(newPhi - phi) < 1e-5) { phi = newPhi; break; }
    phi = newPhi;
  }

  if (!converged) {
    results.innerHTML = `
      <div class="note-box">
        مقطع با ابعاد فعلی گنجایش این لنگر خمشی را ندارد (Rn از حد فشاری بتن فراتر رفت).
        ابعاد مقطع (b یا d) را افزایش دهید یا از آرماتور فشاری (تیر دوآرمه) استفاده کنید.
      </div>`;
    return;
  }

  // As,min per ACI 318 (SI): max( 0.25*sqrt(f'c)/fy , 1.4/fy ) * b * d
  const AsMin = Math.max(
    (0.25 * Math.sqrt(fc) / fy),
    (1.4 / fy)
  ) * b * d;

  let AsFinal = As;
  let minGoverns = false;
  if (AsFinal < AsMin) {
    AsFinal = AsMin;
    minGoverns = true;
    // recompute a, c, epsT, phi, capacity with As,min
    a = (AsFinal * fy) / (0.85 * fc * b);
    c = a / b1;
    epsT = 0.003 * (d - c) / c;
    phi = epsT >= 0.005 ? 0.9 : (epsT <= 0.002 ? 0.65 : 0.65 + (epsT - 0.002) * (0.25 / 0.003));
  }

  const ductile = epsT >= 0.004; // ACI minimum net tensile strain requirement
  const phiMn = phi * AsFinal * fy * (d - a / 2); // N·mm
  const phiMnKNm = phiMn / 1e6;
  const pass = phiMnKNm >= MuInput - 1e-6 && ductile;

  results.innerHTML = `
    <div class="result-row"><span>ضریب β₁</span><span class="val">${fmt(b1, 3)}</span></div>
    <div class="result-row"><span>عمق بلوک فشاری معادل a</span><span class="val">${fmt(a)} mm</span></div>
    <div class="result-row"><span>عمق محور خنثی c</span><span class="val">${fmt(c)} mm</span></div>
    <div class="result-row"><span>کرنش کششی آرماتور ε<sub>t</sub></span><span class="val">${fmt(epsT, 4)}</span></div>
    <div class="result-row"><span>ضریب کاهش مقاومت φ</span><span class="val">${fmt(phi, 3)}</span></div>
    <div class="result-row"><span>A<sub>s,min</sub> (حداقل آیین‌نامه‌ای)</span><span class="val">${fmt(AsMin)} mm²</span></div>
    <div class="result-row highlight"><span>A<sub>s</sub> مورد نیاز ${minGoverns ? '(حداقل حاکم است)' : ''}</span><span class="val">${fmt(AsFinal)} mm²</span></div>
    <div class="result-row highlight"><span>ظرفیت خمشی φM<sub>n</sub></span><span class="val">${fmt(phiMnKNm)} kN·m</span></div>

    <div class="stamp ${pass ? '' : 'fail'}">
      ${pass ? 'PASS — قابل قبول' : 'FAIL — نیاز به بازطراحی'}
      <small>φMn = ${fmt(phiMnKNm)} kN·m ${pass ? '≥' : '<'} Mu = ${fmt(MuInput)} kN·m ${ductile ? '' : '· εt < 0.004 (شکل‌پذیری ناکافی)'}</small>
    </div>

    <div class="note-box">
      این محاسبه صرفاً برای پیش‌طراحی مقطع تک‌آرمه است. کنترل برش، خیز، فاصله میلگردها، پوشش بتن و جزئیات آرماتورگذاری باید جداگانه بر اساس ACI 318 انجام شود.
    </div>
  `;
}

// run once on load with default values
window.addEventListener('DOMContentLoaded', calculate);
