// Script minimal restauré — implémentation unique et cohérente
const freeBtn = document.getElementById('freeBtn');
const paidBtn = document.getElementById('paidBtn');
const freeForm = document.getElementById('freeForm');
const paidForm = document.getElementById('paidForm');
const canvas = document.getElementById('qrCanvas');
const downloadButton = document.getElementById('downloadBtn');
const payButton = document.getElementById('payBtn');
const paymentPanel = document.getElementById('paymentPanel');
const genMerchantCode = document.getElementById('genMerchantCode');
const cancelPayment = document.getElementById('cancelPayment');
const confirmPayment = document.getElementById('confirmPayment');

let lastGenerated = null;
let paidForCustomization = false ;

function clearQR() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (downloadButton) downloadButton.style.display = 'none';
    if (payButton) payButton.style.display = 'none';
}

if (freeBtn) freeBtn.addEventListener('click', () => {
    freeBtn.classList.add('active'); paidBtn.classList.remove('active');
    freeForm.classList.add('active'); paidForm.classList.remove('active');
    clearQR();
    // Supprimer les accents premium lors du passage au mode gratuit
    document.querySelectorAll('#paidForm button, .payment-panel button').forEach(b => b.classList.remove('premium-accent'));
});
if (paidBtn) paidBtn.addEventListener('click', () => {
    paidBtn.classList.add('active'); freeBtn.classList.remove('active');
    paidForm.classList.add('active'); freeForm.classList.remove('active');
    clearQR();
    // Appliquer l'accent premium (doré) aux boutons de la zone premium
    document.querySelectorAll('#paidForm button, .payment-panel button').forEach(b => b.classList.add('premium-accent'));
});

function getColor(id){ const el = document.getElementById(id); return (el && el.value)?el.value:'#000000'; }

function roundRect(ctx,x,y,w,h,r,fill){ if(r===undefined) r=6; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill) ctx.fill(); }

function drawBottomText(cnv, text, color='#000'){ if(!cnv) return; const ctx = cnv.getContext('2d'); const size = cnv.width; const fontSize = Math.max(12,Math.floor(size*0.04)); ctx.save(); ctx.font=`${fontSize}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='bottom'; const padding = Math.max(6,Math.floor(size*0.02)); const textWidth = ctx.measureText(text).width; const rectW = Math.min(size-8, textWidth+16); const rectH = fontSize+10; const rectX=(size-rectW)/2; const rectY=size-padding-rectH; ctx.fillStyle='rgba(255,255,255,0.95)'; roundRect(ctx,rectX,rectY,rectW,rectH,true); ctx.fillStyle=color; ctx.fillText(text,size/2,size-padding-6); ctx.restore(); }

// Fonction pour dessiner le texte au centre du QR (plus visible)
function drawCenterText(cnv, text, color='#000'){ 
    if(!cnv) return; 
    const ctx = cnv.getContext('2d'); 
    const size = cnv.width; 
    const fontSize = Math.max(14,Math.floor(size*0.08)); 
    ctx.save(); 
    ctx.font=`bold ${fontSize}px sans-serif`; 
    ctx.textAlign='center'; 
    ctx.textBaseline='middle'; 
    // Fond blanc semi-transparent pour le texte
    const textWidth = ctx.measureText(text).width;
    const rectW = textWidth + 20;
    const rectH = fontSize + 16;
    const rectX = (size - rectW) / 2;
    const rectY = (size - rectH) / 2;
    ctx.fillStyle='rgba(255,255,255,0.95)'; 
    roundRect(ctx,rectX,rectY,rectW,rectH,8,true); 
    ctx.fillStyle=color; 
    ctx.fillText(text,size/2,size/2); 
    ctx.restore(); 
}

async function drawCenterImage(cnv,img){ if(!cnv||!img) return; const ctx = cnv.getContext('2d'); const size=cnv.width; const box=Math.floor(size*0.26); const x=Math.floor((size-box)/2); const y=x; const pad=Math.floor(box*0.12); const iw=box-pad*2; ctx.save(); const rr=Math.max(6,Math.floor(iw*0.12)); ctx.beginPath(); ctx.moveTo(x+pad+rr,y+pad); ctx.arcTo(x+pad+iw,y+pad,x+pad+iw,y+pad+iw,rr); ctx.arcTo(x+pad+iw,y+pad+iw,x+pad,y+pad+iw,rr); ctx.arcTo(x+pad,y+pad+iw,x+pad,y+pad,rr); ctx.arcTo(x+pad,y+pad,x+pad+iw,y+pad,rr); ctx.closePath(); ctx.clip(); ctx.drawImage(img,x+pad,y+pad,iw,iw); ctx.restore(); ctx.save(); ctx.lineWidth = Math.max(1,Math.floor(iw*0.03)); ctx.strokeStyle='rgba(255,255,255,0.95)'; ctx.strokeRect(x+pad-0.5,y+pad-0.5,iw+1,iw+1); ctx.restore(); }

// Générer QR gratuit
const generateFree = document.getElementById('generateFree');
if(generateFree) generateFree.addEventListener('click', async ()=>{
    const text = (document.getElementById('freeUrl')||{}).value||'';
    const size = parseInt((document.getElementById('freeSize')||{}).value||'300',10);
    if(!text) return alert('Entrez du texte/URL');
    canvas.width = size; canvas.height = size;
    const color = getColor('freeColor');
    await QRCode.toCanvas(canvas, text, { width: size, color: { dark: color, light: '#fff' }, margin:1 });
    drawCenterText(canvas,'',color);
    lastGenerated = { text, size, color, previewDataURL: canvas.toDataURL('image/png') };
    if(downloadButton) downloadButton.style.display = 'inline-block';
});

// Générer QR payant
const generatePaid = document.getElementById('generatePaid');
if(generatePaid) generatePaid.addEventListener('click', async ()=>{
    const text = (document.getElementById('paidUrl')||{}).value||'';
    const size = parseInt((document.getElementById('paidSize')||{}).value||'300',10);
    if(!text) return alert('Entrez du texte/URL');
    canvas.width = size; canvas.height = size;
    const color = getColor('paidColor');
    await QRCode.toCanvas(canvas, text, { width: size, color: { dark: color, light: '#fff' }, margin:1 });
    const overlayType = (document.querySelector('input[name="paidOverlayType"]:checked')||{}).value||'image';
    if(overlayType==='text'){ const paidText = (document.getElementById('paidOverlayText')||{}).value||''; if(!paidText) return alert('Entrez le texte (max 10 chars)'); drawCenterText(canvas, paidText, color); lastGenerated={ text, size, color, previewDataURL: canvas.toDataURL('image/png') }; }
    else { const fileEl = document.getElementById('paidOverlayImageInput'); const file = fileEl && fileEl.files && fileEl.files[0]; if(file){ const img=new Image(); const rd=new FileReader(); rd.onload=()=>{ img.src=rd.result; img.onload=()=>{ drawCenterImage(canvas,img); lastGenerated={ text, size, color, previewDataURL: canvas.toDataURL('image/png') }; }; }; rd.readAsDataURL(file); } else { lastGenerated={ text, size, color, previewDataURL: canvas.toDataURL('image/png') }; } }
    paidForCustomization=false; if(downloadButton) downloadButton.style.display='none'; if(payButton) payButton.style.display='inline-block';
});

if(payButton) payButton.addEventListener('click', ()=>{
    // Masquer le bouton "Payer pour débloquer" définitivement
    if(payButton) payButton.style.display='none';
    
    // Masquer tous les éléments sauf le QR et le panneau de paiement
    const header = document.querySelector('header');
    const options = document.querySelector('.options');
    const freeForm = document.getElementById('freeForm');
    const paidForm = document.getElementById('paidForm');
    
    if(header) header.style.display = 'none';
    if(options) options.style.display = 'none';
    if(freeForm) freeForm.style.display = 'none';
    if(paidForm) paidForm.style.display = 'none';
    
    // Afficher le champ de lien au-dessus du QR avec le texte/lien utilisé
    const qrLinkDisplay = document.getElementById('qrLinkDisplay');
    const qrLinkField = document.getElementById('qrLinkField');
    if(qrLinkDisplay && qrLinkField && lastGenerated && lastGenerated.text) {
        qrLinkDisplay.style.display = 'block';
        qrLinkField.value = lastGenerated.text;
    }
    
    // Afficher le panneau de paiement
    if(paymentPanel) {
        paymentPanel.style.display='block';
        // Masquer le sélecteur de couleur dans le panneau de paiement
        const payQrColorWrap = document.getElementById('payQrColorWrap');
        if(payQrColorWrap) payQrColorWrap.style.display = 'none';
    }
});
if(cancelPayment) cancelPayment.addEventListener('click', ()=>{
    // Restaurer tous les éléments
    const header = document.querySelector('header');
    const options = document.querySelector('.options');
    const freeForm = document.getElementById('freeForm');
    const paidForm = document.getElementById('paidForm');
    
    if(header) header.style.display = '';
    if(options) options.style.display = '';
    
    // Masquer le champ de lien (il ne doit être visible que pendant le processus de paiement)
    const qrLinkDisplay = document.getElementById('qrLinkDisplay');
    if(qrLinkDisplay) qrLinkDisplay.style.display='none';
    
    // Restaurer le formulaire approprié selon l'onglet actif
    if(paidBtn && paidBtn.classList.contains('active')) {
        if(freeForm) freeForm.style.display = 'none';
        if(paidForm) paidForm.style.display = 'block';
    } else {
        if(freeForm) freeForm.style.display = 'block';
        if(paidForm) paidForm.style.display = 'none';
    }
    
    // Masquer le panneau de paiement
    if(paymentPanel) paymentPanel.style.display='none';
    
    // Le bouton "Payer pour débloquer" ne doit pas réapparaître après avoir été cliqué
    // Il reste masqué définitivement
});

// Fonction pour générer un code QR marchand selon l'opérateur
function generateMerchantQR(operator, phone, amount) {
    const fullPhone = '+221' + phone;
    const amountStr = amount.toString();
    
    // Formats de codes QR marchands selon l'opérateur
    let qrData = '';
    switch(operator) {
        case 'Wave':
            // Format Wave Merchant QR
            qrData = `wave://merchant?phone=${fullPhone}&amount=${amountStr}`;
            break;
        case 'OrangeMoney':
            // Format Orange Money Merchant QR
            qrData = `orangemoney://merchant?phone=${fullPhone}&amount=${amountStr}`;
            break;
        case 'FreeMoney':
            // Format Free Money Merchant QR
            qrData = `freemoney://merchant?phone=${fullPhone}&amount=${amountStr}`;
            break;
        default:
            qrData = JSON.stringify({ type: 'merchant_payment', operator, phone: fullPhone, amount: amountStr });
    }
    return qrData;
}

// Fonction pour créer et afficher le code QR marchand de l'opérateur sélectionné
async function displayMerchantQR(operator, phone, amount) {
    const container = document.getElementById('merchantQrContainer');
    if(!container) return;
    
    container.innerHTML = ''; // Vider le conteneur
    
    const qrData = generateMerchantQR(operator, phone, amount);
    const size = 250; // Taille un peu plus grande pour un seul QR
    
    // Créer un canvas temporaire pour générer le QR
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    try {
        await QRCode.toCanvas(canvas, qrData, { 
            width: size, 
            color: { dark: '#000', light: '#fff' }, 
            margin: 1 
        });
        
        // Créer le conteneur pour le QR
        const qrWrapper = document.createElement('div');
        qrWrapper.style.textAlign = 'center';
        qrWrapper.style.padding = '20px';
        qrWrapper.style.background = '#fff';
        qrWrapper.style.borderRadius = '8px';
        qrWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        qrWrapper.style.maxWidth = '300px';
        qrWrapper.style.margin = '0 auto';
        
        // Logo de l'opérateur
        const logoImg = document.createElement('img');
        const logoMap = {
            'Wave': 'wave.png',
            'OrangeMoney': 'OrangeMoney.png',
            'FreeMoney': 'freeMoney.png'
        };
        logoImg.src = logoMap[operator] || '';
        logoImg.style.width = '40px';
        logoImg.style.height = '40px';
        logoImg.style.marginBottom = '12px';
        logoImg.style.display = 'inline-block';
        
        // Nom de l'opérateur
        const operatorName = document.createElement('div');
        operatorName.textContent = operator === 'OrangeMoney' ? 'Orange Money' : operator === 'FreeMoney' ? 'Free Money' : operator;
        operatorName.style.fontWeight = 'bold';
        operatorName.style.marginBottom = '15px';
        operatorName.style.fontSize = '16px';
        
        // Image du QR
        const qrImg = document.createElement('img');
        qrImg.src = canvas.toDataURL('image/png');
        qrImg.style.width = '100%';
        qrImg.style.maxWidth = '250px';
        qrImg.style.height = 'auto';
        qrImg.style.borderRadius = '4px';
        
        // Instructions
        const instruction = document.createElement('div');
        instruction.textContent = 'Scannez avec votre application pour payer';
        instruction.style.fontSize = '13px';
        instruction.style.color = '#666';
        instruction.style.marginTop = '15px';
        
        qrWrapper.appendChild(logoImg);
        qrWrapper.appendChild(operatorName);
        qrWrapper.appendChild(qrImg);
        qrWrapper.appendChild(instruction);
        container.appendChild(qrWrapper);
    } catch(err) {
        console.error(`Erreur génération QR ${operator}:`, err);
    }
}

if(genMerchantCode) genMerchantCode.addEventListener('click', async ()=>{
    const operator = (document.querySelector('input[name="operator"]:checked')||{}).value||'Wave';
    const phoneInput = document.getElementById('payPhone');
    const phone = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '') : '';
    const amount = 500; // Montant fixe pour l'instant
    
    // Valider que le numéro contient exactement 9 chiffres
    if(!phone) {
        alert('Veuillez entrer un numéro de téléphone');
        if(phoneInput) phoneInput.focus();
        return;
    }
    
    if(phone.length !== 9) {
        alert('Le numéro de téléphone doit contenir exactement 9 chiffres');
        if(phoneInput) {
            phoneInput.focus();
            phoneInput.style.borderColor = '#ff6b6b';
        }
        return;
    }
    
    // Masquer les boutons Payer et Annuler
    if(genMerchantCode) genMerchantCode.style.display='none';
    if(cancelPayment) cancelPayment.style.display='none';
    
    // Masquer les champs du formulaire
    const paymentPanel = document.getElementById('paymentPanel');
    if(paymentPanel) {
        const operatorsDiv = paymentPanel.querySelector('.operators');
        const payAmountDisplay = document.getElementById('payAmountDisplay');
        const allLabels = paymentPanel.querySelectorAll('label');
        const phoneInputContainer = phoneInput ? phoneInput.closest('div') : null;
        const h3 = paymentPanel.querySelector('h3');
        const note = paymentPanel.querySelector('.note');
        
        if(operatorsDiv) operatorsDiv.style.display='none';
        if(payAmountDisplay) payAmountDisplay.style.display='none';
        allLabels.forEach(label => label.style.display='none');
        if(phoneInputContainer) phoneInputContainer.style.display='none';
        if(h3) h3.style.display='none';
        if(note) note.style.display='none';
    }
    
    // Afficher le code QR marchand de l'opérateur sélectionné
    const merchantQrPreview = document.getElementById('merchantQrPreview');
    if(merchantQrPreview) {
        merchantQrPreview.style.display='block';
        await displayMerchantQR(operator, phone, amount);
    }
    
    // Afficher le bouton de confirmation
    if(confirmPayment) confirmPayment.style.display='inline-block';
});

if(confirmPayment) confirmPayment.addEventListener('click', ()=>{
    // Masquer les codes QR marchands
    const merchantQrPreview = document.getElementById('merchantQrPreview');
    if(merchantQrPreview) merchantQrPreview.style.display='none';
    
    // Masquer le bouton de confirmation
    if(confirmPayment) confirmPayment.style.display='none';
    
    // Afficher la confirmation de paiement
    const paymentConfirmation = document.getElementById('paymentConfirmation');
    const paymentInfo = document.getElementById('paymentInfo');
    if(paymentConfirmation) {
        paymentConfirmation.style.display='block';
        const phoneInput = document.getElementById('payPhone');
        const phone = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '') : '';
        const amount = 500;
        const operator = (document.querySelector('input[name="operator"]:checked')||{}).value||'Wave';
        const operatorName = operator === 'OrangeMoney' ? 'Orange Money' : operator === 'FreeMoney' ? 'Free Money' : operator;
        if(paymentInfo) {
            paymentInfo.textContent = `Montant payé: ${amount} FCFA | Numéro: +221${phone} | Opérateur: ${operatorName}`;
        }
    }
    
    // S'assurer que le QR personnalisé est visible
    if(canvas && lastGenerated) {
        canvas.style.display = 'block';
        const img = new Image();
        img.src = lastGenerated.previewDataURL;
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
    }
    
    // Afficher le bouton de téléchargement en bas après confirmation
    setTimeout(() => {
        paidForCustomization = true;
        // S'assurer que le champ de lien reste visible
        const qrLinkDisplay = document.getElementById('qrLinkDisplay');
        if(qrLinkDisplay) qrLinkDisplay.style.display='block';
        
        // Afficher le bouton télécharger en bas
        const postActions = document.querySelector('.post-actions');
        if(postActions) {
            postActions.style.display = 'flex';
            postActions.style.justifyContent = 'center';
            postActions.style.marginTop = '30px';
        }
        if(downloadButton) {
            downloadButton.style.display='block';
        }
    }, 1500);
});

if(downloadButton) downloadButton.addEventListener('click', ()=>{ if(!lastGenerated || !lastGenerated.previewDataURL) return alert('Générez d\'abord un QR'); const link=document.createElement('a'); link.href=lastGenerated.previewDataURL; link.download='qr-code.png'; link.click(); });

// -------------------------
// Contrôles de superposition payante + compteur
// -------------------------
function updatePaidOverlayFields() {
    const overlayType = (document.querySelector('input[name="paidOverlayType"]:checked') || {}).value || 'image';
    const imgField = document.getElementById('paidOverlayImageField');
    const txtField = document.getElementById('paidOverlayTextField');
    if (overlayType === 'text') {
        if (imgField) imgField.style.display = 'none';
        if (txtField) txtField.style.display = 'block';
    } else {
        if (imgField) imgField.style.display = 'block';
        if (txtField) txtField.style.display = 'none';
    }
}

// Attacher les écouteurs de changement aux boutons radio de superposition
document.querySelectorAll('input[name="paidOverlayType"]').forEach(r => r.addEventListener('change', updatePaidOverlayFields));

// Compteur de caractères pour le texte de superposition payante (format N/10)
const paidTextEl = document.getElementById('paidOverlayText');
const paidCounterEl = document.getElementById('paidOverlayTextCounter');
if (paidTextEl && paidCounterEl) {
    const update = () => { paidCounterEl.textContent = `${paidTextEl.value.length}/10`; if (paidTextEl.value.length > 10) paidTextEl.value = paidTextEl.value.slice(0,10); };
    paidTextEl.addEventListener('input', update);
    // Initialiser
    update();
}

// Restreindre le champ numéro aux chiffres uniquement (9 chiffres maximum)
const payPhoneInput = document.getElementById('payPhone');
if(payPhoneInput) {
    payPhoneInput.addEventListener('input', (e) => {
        // Ne garder que les chiffres (0-9) et limiter à 9 caractères
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
        // Réinitialiser la bordure si le numéro est valide (9 chiffres)
        if(e.target.value.length === 9) {
            e.target.style.borderColor = '';
        }
    });
    
    // Empêcher la saisie de caractères non numériques
    payPhoneInput.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
    });
    
    // Ajouter un indicateur visuel si le numéro n'est pas valide
    payPhoneInput.addEventListener('blur', (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if(value.length > 0 && value.length !== 9) {
            e.target.style.borderColor = '#ff6b6b';
        } else {
            e.target.style.borderColor = '';
        }
    });
}

// Initialiser les accents de la zone payante au chargement si le premium est actif
document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que les champs de superposition payante corrects sont visibles
    updatePaidOverlayFields();
    // Appliquer l'accent premium si l'onglet payant est actif
    if (paidBtn && paidBtn.classList.contains('active')) {
        document.querySelectorAll('#paidForm button, .payment-panel button').forEach(b => b.classList.add('premium-accent'));
    }
});