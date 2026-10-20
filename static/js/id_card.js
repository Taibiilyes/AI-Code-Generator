/**
 * Professional ID Card Maker Studio — برنامج صنع بطاقات التعريف الوظيفية
 * High-Resolution HTML5 Canvas Engine (2560x1400 / 300+ DPI Print Ready)
 */

(function () {
    "use strict";

    // Default state configured for S.S.G LILHIRASSA WA ELAMEN
    function getDefaultState() {
        return {
            id: null,
            companyName: "S.S.G LILHIRASSA WA ELAMEN",
            headerStyle: "hollow", // hollow | double | solid-outline | solid
            companyFontSize: 54,
            companySubtitle: "Société de Gardiennage et d'Escort de Fonds et de Produits Sensibles",
            cardTitle: "CARTE PROFESSIONNELLE",

            // Logo settings
            logoMode: "vector", // vector | extracted | custom
            logoScale: 1.0,
            logoOffsetX: 0,
            shieldArabic: "للحراسة والأمن",
            shieldLine1: "S.S.G",
            shieldLine2: "ELAMEN",
            shieldLeft: "PROTECTION",
            shieldRight: "SÉCURITÉ",
            shieldPrimaryColor: "#24333f",
            shieldAccentColor: "#59a1be",
            shieldInnerBg: "#c8e3ed",
            customLogoDataUrl: null,

            // Employee fields
            nom: "AISSAT",
            prenom: "ATMANE",
            matricule: "11 310",
            groupeSanguin: "O-",
            fonction: "A.P.S",
            dateExpiration: "10/04/2023",
            wilaya: "Tébessa",

            // Field labels
            labelNom: "Nom:",
            labelPrenom: "Prénom:",
            labelMatricule: "Matricule:",
            labelGroupeSanguin: "Groupe sanguin:",
            labelFonction: "Fonction",
            labelDateExpiration: "Date d'expiration:",
            labelWilaya: "Wilaya:",
            fieldsDirection: "ltr",
            fieldsFontSize: 34,
            extraFields: [],

            // Photo settings
            photoMode: "default", // default | custom | avatar
            photoDataUrl: "/static/assets/card/default_photo.jpg",
            photoZoom: 1.0,
            photoOffsetX: 0,
            photoOffsetY: 0,
            photoBrightness: 100,
            photoContrast: 100,
            photoBorder: "none",
            photoRadius: 0,

            // Stamp (Cachet) settings
            showStamp: true,
            stampTopText: "S.S.G LILHIRASSA WA ELAMEN",
            stampBottomText: "PROTECTION & SÉCURITÉ",
            stampCenterText: "SÉCURITÉ",
            stampColor: "#cc3b42",
            stampOpacity: 0.16,
            stampAngle: -75,
            stampX: 805,
            stampY: 455,

            // Colors
            cardBgColor: "#f4f5f3",
            headerOutlineColor: "#377b9c",
            bannerBgColor: "#1c1f24",
            bannerTextColor: "#f0f4f7",
            labelColor: "#52667d",
            valueColor: "#22262c",

            // Card Back (Verso)
            backNotice: "Cette carte professionnelle est strictement personnelle. Toute personne trouvant cette carte est priée de la remettre à la direction.",
            backPhone: "+213 (0) 37 00 00 00",
            backAddress: "Direction Générale — Algérie",

            // View options
            activeSide: "front", // front | back
            aspectMode: "model"  // model (1280x700) | cr80 (1200x757)
        };
    }

    let state = getDefaultState();
    const canvas = document.getElementById("card-canvas");
    const ctx = canvas.getContext("2d");

    // Preloaded images cache
    const images = {
        defaultPhoto: new Image(),
        extractedShield: new Image(),
        customPhoto: null,
        customLogo: null,
        customStamp: null
    };

    images.defaultPhoto.crossOrigin = "anonymous";
    images.extractedShield.crossOrigin = "anonymous";

    images.defaultPhoto.onload = () => renderCard();
    images.extractedShield.onload = () => renderCard();

    images.defaultPhoto.src = "/static/assets/card/default_photo.jpg";
    images.extractedShield.src = "/static/assets/card/extracted_shield.png";

    // Ensure web fonts finish loading so Canvas text metrics are accurate
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => renderCard());
    }

    // =========================================================================
    // MAIN RENDER PIPELINE
    // =========================================================================
    function renderCard() {
        const logicalW = state.aspectMode === "cr80" ? 1200 : 1280;
        const logicalH = state.aspectMode === "cr80" ? 757 : 700;
        const scale = 2; // 2x Super-sampling for 300+ DPI print quality

        if (canvas.width !== logicalW * scale || canvas.height !== logicalH * scale) {
            canvas.width = logicalW * scale;
            canvas.height = logicalH * scale;
        }

        ctx.save();
        ctx.scale(scale, scale);

        if (state.activeSide === "back") {
            drawBackCard(ctx, logicalW, logicalH);
        } else {
            drawFrontCard(ctx, logicalW, logicalH);
        }

        ctx.restore();
    }

    // =========================================================================
    // FRONT CARD (RECTO) — Exact Match to SARL AL-AMINE GARD Reference
    // =========================================================================
    function drawFrontCard(ctx, W, H) {
        // 1. Card Background + Subtle Security Micro-texture
        ctx.fillStyle = state.cardBgColor || "#f4f5f3";
        ctx.fillRect(0, 0, W, H);

        // Subtle fine security card grain
        ctx.save();
        ctx.strokeStyle = "rgba(55, 123, 156, 0.03)";
        ctx.lineWidth = 1;
        for (let y = 8; y < H; y += 6) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Top Header: Company Name (SARL AL-AMINE GARD)
        drawCompanyHeader(ctx, W);

        // 3. Company Subtitle (Société de Gardiennage...)
        ctx.save();
        ctx.font = "700 22.5px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = "#232830";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(state.companySubtitle || "", W * 0.52, 122, W - 90);
        ctx.restore();

        // 4. Black Title Banner (CARTE PROFESSIONNELLE)
        const bannerX = 376;
        const bannerY = 150;
        const bannerW = W - bannerX - 24;
        const bannerH = 96;

        ctx.save();
        ctx.fillStyle = state.bannerBgColor || "#1c1f24";
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

        ctx.font = "600 44px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = state.bannerTextColor || "#f0f4f7";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "3px";
        }
        ctx.fillText(
            state.cardTitle || "CARTE PROFESSIONNELLE",
            bannerX + bannerW / 2,
            bannerY + bannerH / 2 + 2,
            bannerW - 30
        );
        ctx.restore();

        // 5. Left Company Shield / Logo
        drawCompanyLogoSection(ctx, H);

        // 6. Employee Personal Photo (Bottom Right)
        const photoW = 304;
        const photoH = 368;
        const photoX = W - photoW - 38;
        const photoY = H - photoH - 22;
        drawEmployeePhoto(ctx, photoX, photoY, photoW, photoH);

        // 7. Faint Circular Company Rubber Stamp (Cachet)
        if (state.showStamp) {
            drawCompanyStamp(ctx, state.stampX, state.stampY);
        }

        // 8. Center Employee Information Fields (Nom, Prénom, Matricule...)
        drawEmployeeFields(ctx, bannerX + 8, 286, photoX - 18, H - 22);
    }

    // =========================================================================
    // COMPANY HEADER TITLE (Hollow Cyan-Blue Outlined Letters as in Original)
    // =========================================================================
    function drawCompanyHeader(ctx, W) {
        const text = (state.companyName || "").trim();
        if (!text) return;

        ctx.save();
        const fontSize = Number(state.companyFontSize) || 64;
        ctx.font = `900 ${fontSize}px 'Orbitron', 'Exo 2', 'Montserrat', 'Cairo', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "2px";
        }

        const centerX = W * 0.52;
        const centerY = 62;
        const maxW = W - 100;
        const outlineColor = state.headerOutlineColor || "#377b9c";
        const bgFill = state.cardBgColor || "#f4f5f3";

        if (state.headerStyle === "hollow") {
            // Matches the exact SARL AL-AMINE GARD hollow blue-outlined letters
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 8.5;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.strokeStyle = "#d9ebf3";
            ctx.lineWidth = 4.2;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.fillStyle = bgFill;
            ctx.fillText(text, centerX, centerY, maxW);

            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 2.0;
            ctx.strokeText(text, centerX, centerY, maxW);
        } else if (state.headerStyle === "double") {
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 10;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.fillStyle = outlineColor;
            ctx.fillText(text, centerX, centerY, maxW);
        } else if (state.headerStyle === "solid-outline") {
            ctx.strokeStyle = "#1c1f24";
            ctx.lineWidth = 7;
            ctx.strokeText(text, centerX, centerY, maxW);
            ctx.fillStyle = outlineColor;
            ctx.fillText(text, centerX, centerY, maxW);
        } else {
            ctx.fillStyle = outlineColor;
            ctx.fillText(text, centerX, centerY, maxW);
        }

        ctx.restore();
    }

    // =========================================================================
    // LEFT SHIELD LOGO (Dynamic Vector Shield / Extracted Original / Custom)
    // =========================================================================
    function drawCompanyLogoSection(ctx, H) {
        const baseX = 16 + (Number(state.logoOffsetX) || 0);
        const baseY = 194;
        const baseW = 344;
        const baseH = H - baseY - 20;
        const scale = Number(state.logoScale) || 1.0;

        const cx = baseX + baseW / 2;
        const cy = baseY + baseH / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        if (state.logoMode === "extracted" && images.extractedShield.complete && images.extractedShield.naturalWidth > 0) {
            ctx.drawImage(images.extractedShield, baseX, baseY, baseW, baseH);
        } else if (state.logoMode === "custom" && images.customLogo && images.customLogo.complete) {
            // Fit custom logo proportionally inside box
            const img = images.customLogo;
            const ratio = Math.min(baseW / img.naturalWidth, baseH / img.naturalHeight);
            const drawW = img.naturalWidth * ratio;
            const drawH = img.naturalHeight * ratio;
            ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
        } else {
            // Default: High-Precision Dynamic Vector Shield matching AL-AMINE GARD
            drawVectorShield(ctx, cx, baseY, baseW, baseH);
        }

        ctx.restore();
    }

    function makeShieldPath(ctx, cx, topY, w, h) {
        const halfW = w / 2;
        const shoulderY = topY + h * 0.11;
        const bottomY = topY + h;

        ctx.beginPath();
        // Top arch
        ctx.moveTo(cx - halfW + 8, shoulderY);
        ctx.quadraticCurveTo(cx, topY - h * 0.03, cx + halfW - 8, shoulderY);
        // Right side curving to bottom tip
        ctx.bezierCurveTo(
            cx + halfW + 6, topY + h * 0.46,
            cx + halfW * 0.56, topY + h * 0.80,
            cx, bottomY
        );
        // Left side curving from bottom tip back to top-left shoulder
        ctx.bezierCurveTo(
            cx - halfW * 0.56, topY + h * 0.80,
            cx - halfW - 6, topY + h * 0.46,
            cx - halfW + 8, shoulderY
        );
        ctx.closePath();
    }

    function drawVectorShield(ctx, cx, topY, w, h) {
        const primary = state.shieldPrimaryColor || "#24333f";
        const accent = state.shieldAccentColor || "#59a1be";
        const innerBg = state.shieldInnerBg || "#c8e3ed";

        ctx.save();

        // Subtle drop shadow for shield
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // 1. Outer Dark Shield
        makeShieldPath(ctx, cx, topY, w, h);
        ctx.fillStyle = primary;
        ctx.fill();

        ctx.shadowColor = "transparent";

        // 2. Sky-Blue Inner Shield Border Line (#59a1be)
        makeShieldPath(ctx, cx, topY + 15, w - 28, h - 32);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 12;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Top-center dark mask over the sky-blue border where Arabic title sits
        const arText = (state.shieldArabic || "").trim();
        if (arText) {
            ctx.save();
            const isLongAr = arText.length > 8;
            const arFontSize = isLongAr ? 27 : 38;
            ctx.font = `800 ${arFontSize}px 'Cairo', 'Tajawal', sans-serif`;
            const measuredW = Math.min(w * 0.68, Math.max(130, ctx.measureText(arText).width + 32));

            ctx.fillStyle = primary;
            ctx.beginPath();
            ctx.ellipse(cx, topY + 34, measuredW / 2, 26, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#e3eff5";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(arText, cx, topY + 36, w * 0.64);
            ctx.restore();
        }

        // 3. Curved Upper Latin Lines ("AL-AMINE" and "GARD")
        drawCurvedText(
            ctx,
            (state.shieldLine1 || "").toUpperCase(),
            cx,
            topY + 315,
            235,
            "900 35px 'Orbitron', 'Exo 2', 'Montserrat', sans-serif",
            "#e3eff5",
            0.095
        );

        drawCurvedText(
            ctx,
            (state.shieldLine2 || "").toUpperCase(),
            cx,
            topY + 335,
            205,
            "900 35px 'Orbitron', 'Exo 2', 'Montserrat', sans-serif",
            "#e3eff5",
            0.095
        );

        // 4. Center Pale Ice-Blue Inner Shield (#c8e3ed)
        const innerTop = topY + h * 0.36;
        const innerW = w * 0.58;
        const innerH = h * 0.47;

        makeShieldPath(ctx, cx, innerTop, innerW, innerH);
        ctx.fillStyle = innerBg;
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.stroke();

        // 5. Stars inside the Inner Shield (Main chevron-split star + 3 small stars)
        const starCenterY = innerTop + innerH * 0.43;
        drawMainSplitStar(ctx, cx, starCenterY, 72, primary, innerBg);

        // 3 small 5-pointed stars (top-left, top-right, bottom)
        drawFivePointStar(ctx, cx - 50, starCenterY - 40, 15, 6.5, primary);
        drawFivePointStar(ctx, cx + 50, starCenterY - 40, 15, 6.5, primary);
        drawFivePointStar(ctx, cx, starCenterY + 74, 15, 6.5, primary);

        // 6. Angled Side Texts ("PROTECTION" on left, "SÉCURITÉ" on right)
        drawAngledShieldSideText(ctx, state.shieldLeft || "PROTECTION", cx - w * 0.255, topY + h * 0.65, 63.5 * (Math.PI / 180));
        drawAngledShieldSideText(ctx, state.shieldRight || "SÉCURITÉ", cx + w * 0.255, topY + h * 0.65, -63.5 * (Math.PI / 180));

        ctx.restore();
    }

    function drawCurvedText(ctx, text, cx, arcCenterY, radius, font, color, charAngleStep) {
        if (!text) return;
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const totalAngle = (text.length - 1) * charAngleStep;
        const startAngle = -Math.PI / 2 - totalAngle / 2;

        for (let i = 0; i < text.length; i++) {
            const angle = startAngle + i * charAngleStep;
            ctx.save();
            ctx.translate(cx + Math.cos(angle) * radius, arcCenterY + Math.sin(angle) * radius);
            ctx.rotate(angle + Math.PI / 2);
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawAngledShieldSideText(ctx, text, x, y, angleRad) {
        if (!text) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad);
        ctx.font = "800 24px 'Orbitron', 'Exo 2', 'Montserrat', sans-serif";
        ctx.fillStyle = "#e3eff5";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "2px";
        }
        ctx.fillText(text.toUpperCase(), 0, 0);
        ctx.restore();
    }

    function drawFivePointStar(ctx, cx, cy, outerR, innerR, fillStyle) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = -Math.PI / 2 + (i * Math.PI) / 5;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.restore();
    }

    function drawMainSplitStar(ctx, cx, cy, outerR, starColor, bgColor) {
        ctx.save();
        // Clip to the 5-pointed star silhouette so the chevron cut stays strictly inside the star
        ctx.beginPath();
        const innerR = outerR * 0.39;
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = -Math.PI / 2 + (i * Math.PI) / 5;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = starColor;
        ctx.fill();
        ctx.clip();

        // Draw the distinctive light-blue chevron ribbon across the middle of the star (as in AL-AMINE GARD shield)
        ctx.beginPath();
        ctx.moveTo(cx - outerR, cy + 32);
        ctx.lineTo(cx, cy - 6);
        ctx.lineTo(cx + outerR, cy + 32);
        ctx.lineWidth = 11;
        ctx.strokeStyle = bgColor;
        ctx.lineJoin = "miter";
        ctx.stroke();

        ctx.restore();
    }

    // =========================================================================
    // CENTER EMPLOYEE INFORMATION FIELDS (Nom, Prénom, Matricule, etc.)
    // =========================================================================
    function drawEmployeeFields(ctx, leftX, topY, rightX, bottomY) {
        const rows = [
            { label: state.labelNom, value: state.nom },
            { label: state.labelPrenom, value: state.prenom },
            { label: state.labelMatricule, value: state.matricule },
            { label: state.labelGroupeSanguin, value: state.groupeSanguin },
            { label: state.labelFonction, value: state.fonction },
            { label: state.labelDateExpiration, value: state.dateExpiration },
            { label: state.labelWilaya, value: state.wilaya }
        ];

        if (Array.isArray(state.extraFields)) {
            state.extraFields.forEach((ef) => {
                if (ef && (ef.label || ef.value)) {
                    rows.push({ label: ef.label || "", value: ef.value || "" });
                }
            });
        }

        const totalRows = rows.length;
        const availableH = bottomY - topY;
        const stepY = Math.min(58, availableH / Math.max(totalRows, 1));
        const baseFontSize = Number(state.fieldsFontSize) || 34;
        const labelFontSize = Math.round(baseFontSize * 0.94);

        ctx.save();
        ctx.textBaseline = "middle";

        const isRTL = state.fieldsDirection === "rtl";

        rows.forEach((row, idx) => {
            const y = topY + idx * stepY + stepY * 0.42;
            const lbl = (row.label || "").trim();
            const val = (row.value || "").trim();

            if (!isRTL) {
                // LTR Layout (Exact match to original French card)
                ctx.font = `700 ${labelFontSize}px 'Montserrat', 'Cairo', sans-serif`;
                ctx.fillStyle = state.labelColor || "#52667d";
                ctx.textAlign = "left";
                ctx.fillText(lbl, leftX, y);

                const lblWidth = ctx.measureText(lbl).width;
                const valX = leftX + lblWidth + 22;

                ctx.font = `800 ${baseFontSize}px 'Montserrat', 'Cairo', sans-serif`;
                ctx.fillStyle = state.valueColor || "#22262c";
                ctx.fillText(val, valX, y, Math.max(120, rightX - valX));
            } else {
                // RTL Layout (For Arabic labels mode)
                ctx.font = `700 ${labelFontSize}px 'Cairo', 'Tajawal', sans-serif`;
                ctx.fillStyle = state.labelColor || "#52667d";
                ctx.textAlign = "right";
                ctx.fillText(lbl, rightX, y);

                const lblWidth = ctx.measureText(lbl).width;
                const valX = rightX - lblWidth - 18;

                ctx.font = `800 ${baseFontSize}px 'Cairo', 'Montserrat', sans-serif`;
                ctx.fillStyle = state.valueColor || "#22262c";
                ctx.fillText(val, valX, y, Math.max(120, valX - leftX));
            }
        });

        ctx.restore();
    }

    // =========================================================================
    // EMPLOYEE PERSONAL PHOTO (Bottom Right)
    // =========================================================================
    function drawEmployeePhoto(ctx, x, y, w, h) {
        ctx.save();

        const radius = Number(state.photoRadius) || 0;
        roundedRectPath(ctx, x, y, w, h, radius);
        ctx.fillStyle = "#dfe5ec";
        ctx.fill();
        ctx.clip();

        if (state.photoMode === "avatar") {
            drawAvatarPlaceholder(ctx, x, y, w, h);
        } else {
            const img = state.photoMode === "custom" && images.customPhoto
                ? images.customPhoto
                : images.defaultPhoto;

            if (img && img.complete && img.naturalWidth > 0) {
                const zoom = Number(state.photoZoom) || 1.0;
                const offX = Number(state.photoOffsetX) || 0;
                const offY = Number(state.photoOffsetY) || 0;
                const bright = Number(state.photoBrightness) || 100;
                const contrast = Number(state.photoContrast) || 100;

                ctx.filter = `brightness(${bright}%) contrast(${contrast}%)`;

                // Cover fit calculation
                const scaleCover = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
                const drawW = img.naturalWidth * scaleCover;
                const drawH = img.naturalHeight * scaleCover;
                const drawX = x + (w - drawW) / 2 + offX;
                const drawY = y + (h - drawH) / 2 + offY;

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                ctx.filter = "none";
            } else {
                drawAvatarPlaceholder(ctx, x, y, w, h);
            }
        }

        ctx.restore();

        // Optional Photo Border
        if (state.photoBorder === "thin") {
            ctx.save();
            roundedRectPath(ctx, x, y, w, h, radius);
            ctx.strokeStyle = "#24333f";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        } else if (state.photoBorder === "bold") {
            ctx.save();
            roundedRectPath(ctx, x, y, w, h, radius);
            ctx.strokeStyle = "#24333f";
            ctx.lineWidth = 6;
            ctx.stroke();
            roundedRectPath(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(0, radius - 3));
            ctx.strokeStyle = "#59a1be";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawAvatarPlaceholder(ctx, x, y, w, h) {
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#475569";
        // Head
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.36, w * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // Shoulders / Suit
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.92, w * 0.42, h * 0.34, 0, Math.PI, 0, false);
        ctx.fill();
    }

    function roundedRectPath(ctx, x, y, w, h, r) {
        const rad = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.lineTo(x + w - rad, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
        ctx.lineTo(x + w, y + h - rad);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
        ctx.lineTo(x + rad, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
        ctx.lineTo(x, y + rad);
        ctx.quadraticCurveTo(x, y, x + rad, y);
        ctx.closePath();
    }

    // =========================================================================
    // CIRCULAR COMPANY STAMP / CACHET (Faint Red Seal as in Reference Card)
    // =========================================================================
    function drawCompanyStamp(ctx, cx, cy) {
        const radius = 152;
        const color = state.stampColor || "#cc3b42";
        const opacity = Number(state.stampOpacity) || 0.16;
        const angleRad = ((Number(state.stampAngle) || -75) * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);
        ctx.globalAlpha = opacity;

        if (state.customStampDataUrl && images.customStamp && images.customStamp.complete) {
            const sImg = images.customStamp;
            const maxDim = radius * 2;
            const ratio = Math.min(maxDim / sImg.naturalWidth, maxDim / sImg.naturalHeight);
            const dw = sImg.naturalWidth * ratio;
            const dh = sImg.naturalHeight * ratio;
            ctx.drawImage(sImg, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
            return;
        }

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // Outer Double Circle
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 9, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Circle
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 48, 0, Math.PI * 2);
        ctx.stroke();

        // Top Curved Stamp Text
        drawCurvedText(
            ctx,
            (state.stampTopText || "SARL AL-AMINE GARD").toUpperCase(),
            0,
            0,
            radius - 28,
            "800 20px 'Montserrat', sans-serif",
            color,
            0.13
        );

        // Bottom Curved Stamp Text
        const bottomStr = (state.stampBottomText || "PROTECTION & SÉCURITÉ").toUpperCase();
        ctx.save();
        ctx.rotate(Math.PI);
        drawCurvedText(
            ctx,
            bottomStr,
            0,
            0,
            radius - 28,
            "700 17px 'Montserrat', sans-serif",
            color,
            0.115
        );
        ctx.restore();

        // Center Box & Text ("SÉCURITÉ")
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-86, -24, 172, 48);
        ctx.font = "900 28px 'Montserrat', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((state.stampCenterText || "SÉCURITÉ").toUpperCase(), 0, 1, 160);

        // Side Stars in Stamp
        drawFivePointStar(ctx, -(radius - 28), 0, 8, 3.5, color);
        drawFivePointStar(ctx, radius - 28, 0, 8, 3.5, color);

        ctx.restore();
    }

    // =========================================================================
    // BACK SIDE OF CARD (VERSO) — Barcode / QR + Legal Notice + Company Info
    // =========================================================================
    function drawBackCard(ctx, W, H) {
        // Background
        ctx.fillStyle = state.cardBgColor || "#f4f5f3";
        ctx.fillRect(0, 0, W, H);

        // Top dark bar
        ctx.fillStyle = state.bannerBgColor || "#1c1f24";
        ctx.fillRect(0, 42, W, 68);

        ctx.font = "800 30px 'Orbitron', 'Montserrat', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(state.companyName || "SARL AL-AMINE GARD", W / 2, 76);

        // Watermark Shield in Center
        ctx.save();
        ctx.globalAlpha = 0.08;
        drawVectorShield(ctx, W / 2, 145, 260, 360);
        ctx.restore();

        // Legal Notice Box
        ctx.save();
        ctx.font = "600 24px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        wrapText(ctx, state.backNotice || "", W / 2, 195, W - 180, 38);
        ctx.restore();

        // Simulated Barcode + Matricule Verification Box
        const barW = 460;
        const barH = 85;
        const barX = (W - barW) / 2;
        const barY = H - 245;

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        roundedRectPath(ctx, barX - 20, barY - 15, barW + 40, barH + 55, 10);
        ctx.fill();
        ctx.stroke();

        // Deterministic barcode stripes from matricule + nom
        const codeStr = `${state.matricule || "11310"}-${state.nom || "AISSAT"}-${state.prenom || "ATMANE"}`;
        let cursorX = barX;
        ctx.fillStyle = "#0f172a";
        for (let i = 0; i < 68; i++) {
            const ch = codeStr.charCodeAt(i % codeStr.length);
            const stripeW = ((ch + i * 7) % 3) * 2 + 2;
            const gapW = ((ch * 3 + i) % 2) * 2 + 2;
            if (cursorX + stripeW < barX + barW) {
                ctx.fillRect(cursorX, barY, stripeW, barH);
            }
            cursorX += stripeW + gapW;
        }

        ctx.font = "700 20px monospace";
        ctx.fillStyle = "#334155";
        ctx.textAlign = "center";
        ctx.fillText(`ID: ${state.matricule || ""} | ${state.nom || ""} ${state.prenom || ""}`, W / 2, barY + barH + 22);
        ctx.restore();

        // Footer Contact Info
        ctx.save();
        ctx.font = "700 22px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = state.labelColor || "#52667d";
        ctx.textAlign = "center";
        ctx.fillText(`${state.backAddress || ""}   •   Tél: ${state.backPhone || ""}`, W / 2, H - 45);
        ctx.restore();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(" ");
        let line = "";
        let currY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currY);
                line = words[n] + " ";
                currY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) {
            ctx.fillText(line.trim(), x, currY);
        }
    }

    // =========================================================================
    // UI BINDINGS & REAL-TIME CONTROLS
    // =========================================================================
    function bindInputsToState() {
        const textBindings = [
            ["inp-nom", "nom"],
            ["inp-prenom", "prenom"],
            ["inp-matricule", "matricule"],
            ["inp-groupe-sanguin", "groupeSanguin"],
            ["inp-fonction", "fonction"],
            ["inp-wilaya", "wilaya"],
            ["inp-date-expiration", "dateExpiration"],
            ["lbl-nom", "labelNom"],
            ["lbl-prenom", "labelPrenom"],
            ["lbl-matricule", "labelMatricule"],
            ["lbl-groupe", "labelGroupeSanguin"],
            ["lbl-fonction", "labelFonction"],
            ["lbl-expiration", "labelDateExpiration"],
            ["lbl-wilaya", "labelWilaya"],
            ["inp-company-name", "companyName"],
            ["inp-company-subtitle", "companySubtitle"],
            ["inp-card-title", "cardTitle"],
            ["inp-shield-ar", "shieldArabic"],
            ["inp-shield-l1", "shieldLine1"],
            ["inp-shield-l2", "shieldLine2"],
            ["inp-shield-left", "shieldLeft"],
            ["inp-shield-right", "shieldRight"],
            ["inp-stamp-top", "stampTopText"],
            ["inp-stamp-bottom", "stampBottomText"],
            ["inp-stamp-center", "stampCenterText"],
            ["inp-back-notice", "backNotice"],
            ["inp-back-phone", "backPhone"],
            ["inp-back-address", "backAddress"]
        ];

        textBindings.forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", () => {
                state[key] = el.value;
                renderCard();
            });
        });

        // Blood group quick selector
        const selBlood = document.getElementById("sel-blood");
        const inpBlood = document.getElementById("inp-groupe-sanguin");
        if (selBlood && inpBlood) {
            selBlood.addEventListener("change", () => {
                inpBlood.value = selBlood.value;
                state.groupeSanguin = selBlood.value;
                renderCard();
            });
        }

        // Date picker & +1yr / +2yr buttons
        const datePicker = document.getElementById("inp-date-picker");
        const inpExp = document.getElementById("inp-date-expiration");
        if (datePicker && inpExp) {
            datePicker.addEventListener("change", () => {
                if (datePicker.value) {
                    const [yyyy, mm, dd] = datePicker.value.split("-");
                    inpExp.value = `${dd}/${mm}/${yyyy}`;
                    state.dateExpiration = inpExp.value;
                    renderCard();
                }
            });
        }

        document.getElementById("btn-exp-1yr")?.addEventListener("click", () => setRelativeExpiration(1));
        document.getElementById("btn-exp-2yr")?.addEventListener("click", () => setRelativeExpiration(2));

        // Quick Language Switch for Field Labels (French vs Arabic)
        document.getElementById("btn-labels-fr")?.addEventListener("click", () => {
            state.labelNom = "Nom:";
            state.labelPrenom = "Prénom:";
            state.labelMatricule = "Matricule:";
            state.labelGroupeSanguin = "Groupe sanguin:";
            state.labelFonction = "Fonction";
            state.labelDateExpiration = "Date d'expiration:";
            state.labelWilaya = "Wilaya:";
            state.fieldsDirection = "ltr";
            syncUIFromState();
            renderCard();
            showToast("تم ضبط عناوين الحقول باللغة الفرنسية (كالنموذج الأصلي)");
        });

        document.getElementById("btn-labels-ar")?.addEventListener("click", () => {
            state.labelNom = "اللقب:";
            state.labelPrenom = "الاسم:";
            state.labelMatricule = "رقم التسجيل:";
            state.labelGroupeSanguin = "فصيلة الدم:";
            state.labelFonction = "الوظيفة:";
            state.labelDateExpiration = "تاريخ الانتهاء:";
            state.labelWilaya = "الولاية:";
            state.fieldsDirection = "rtl";
            syncUIFromState();
            renderCard();
            showToast("تم تعريب عناوين الحقول");
        });

        // Select dropdowns
        const selectBindings = [
            ["sel-fields-dir", "fieldsDirection"],
            ["sel-photo-border", "photoBorder"],
            ["sel-header-style", "headerStyle"],
            ["sel-card-aspect", "aspectMode"]
        ];
        selectBindings.forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", () => {
                state[key] = el.value;
                renderCard();
            });
        });

        // Range sliders
        const rangeBindings = [
            ["rng-photo-zoom", "photoZoom", "val-photo-zoom", (v) => `${Math.round(v * 100)}%`],
            ["rng-photo-x", "photoOffsetX", "val-photo-x", (v) => `${v}`],
            ["rng-photo-y", "photoOffsetY", "val-photo-y", (v) => `${v}`],
            ["rng-photo-bright", "photoBrightness", "val-photo-bright", (v) => `${v}%`],
            ["rng-photo-contrast", "photoContrast", "val-photo-contrast", (v) => `${v}%`],
            ["rng-photo-radius", "photoRadius", "val-photo-radius", (v) => `${v}px`],
            ["rng-company-size", "companyFontSize", "val-company-size", (v) => `${v}`],
            ["rng-logo-scale", "logoScale", "val-logo-scale", (v) => `${Math.round(v * 100)}%`],
            ["rng-logo-x", "logoOffsetX", "val-logo-x", (v) => `${v}`],
            ["rng-stamp-opacity", "stampOpacity", "val-stamp-opacity", (v) => `${Math.round(v * 100)}%`],
            ["rng-stamp-angle", "stampAngle", "val-stamp-angle", (v) => `${v}°`],
            ["rng-stamp-x", "stampX", "val-stamp-x", (v) => `${v}`],
            ["rng-stamp-y", "stampY", "val-stamp-y", (v) => `${v}`],
            ["rng-fields-size", "fieldsFontSize", "val-fields-size", (v) => `${v}`]
        ];

        rangeBindings.forEach(([id, key, valId, fmt]) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (!el) return;
            el.addEventListener("input", () => {
                state[key] = Number(el.value);
                if (valEl) valEl.textContent = fmt(Number(el.value));
                renderCard();
            });
        });

        // Color pickers
        const colorBindings = [
            ["clr-shield-primary", "shieldPrimaryColor", "txt-shield-primary"],
            ["clr-shield-accent", "shieldAccentColor", "txt-shield-accent"],
            ["clr-shield-inner", "shieldInnerBg", "txt-shield-inner"],
            ["clr-stamp", "stampColor", "txt-clr-stamp"],
            ["clr-card-bg", "cardBgColor", "txt-card-bg"],
            ["clr-header-outline", "headerOutlineColor", "txt-header-outline"],
            ["clr-banner-bg", "bannerBgColor", "txt-banner-bg"],
            ["clr-label", "labelColor", "txt-clr-label"],
            ["clr-value", "valueColor", "txt-clr-value"]
        ];

        colorBindings.forEach(([id, key, txtId]) => {
            const el = document.getElementById(id);
            const txtEl = document.getElementById(txtId);
            if (!el) return;
            el.addEventListener("input", () => {
                state[key] = el.value;
                if (txtEl) txtEl.textContent = el.value;
                renderCard();
            });
        });

        // Stamp checkbox
        const chkStamp = document.getElementById("chk-show-stamp");
        if (chkStamp) {
            chkStamp.addEventListener("change", () => {
                state.showStamp = chkStamp.checked;
                renderCard();
            });
        }

        // Logo Mode Pills
        document.querySelectorAll(".mode-pill[data-logo-mode]").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".mode-pill[data-logo-mode]").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                state.logoMode = btn.getAttribute("data-logo-mode");

                const vecBox = document.getElementById("vector-shield-settings");
                const custBox = document.getElementById("custom-logo-settings");
                if (vecBox) vecBox.style.display = state.logoMode === "vector" ? "block" : "none";
                if (custBox) custBox.style.display = state.logoMode === "custom" ? "block" : "none";

                if (state.logoMode === "custom" && !images.customLogo) {
                    document.getElementById("inp-logo-file")?.click();
                }
                renderCard();
            });
        });
    }

    function setRelativeExpiration(yearsToAdd) {
        const now = new Date();
        now.setFullYear(now.getFullYear() + yearsToAdd);
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        state.dateExpiration = `${dd}/${mm}/${yyyy}`;
        const inp = document.getElementById("inp-date-expiration");
        if (inp) inp.value = state.dateExpiration;
        renderCard();
    }

    // =========================================================================
    // EXTRA FIELDS MANAGEMENT
    // =========================================================================
    function renderExtraFieldsUI() {
        const container = document.getElementById("extra-fields-container");
        if (!container) return;
        container.innerHTML = "";

        state.extraFields.forEach((field, idx) => {
            const row = document.createElement("div");
            row.className = "form-grid-3";
            row.innerHTML = `
                <input type="text" class="form-input input-ltr extra-lbl" placeholder="عنوان الحقل (مثلاً CIN:)" value="${escapeHtml(field.label || "")}">
                <input type="text" class="form-input input-ltr extra-val" placeholder="القيمة" value="${escapeHtml(field.value || "")}">
                <button type="button" class="btn btn-danger btn-sm extra-del" title="حذف الحقل"><i class="fa-solid fa-trash"></i></button>
            `;
            row.querySelector(".extra-lbl").addEventListener("input", (e) => {
                state.extraFields[idx].label = e.target.value;
                renderCard();
            });
            row.querySelector(".extra-val").addEventListener("input", (e) => {
                state.extraFields[idx].value = e.target.value;
                renderCard();
            });
            row.querySelector(".extra-del").addEventListener("click", () => {
                state.extraFields.splice(idx, 1);
                renderExtraFieldsUI();
                renderCard();
            });
            container.appendChild(row);
        });
    }

    document.getElementById("btn-add-extra-field")?.addEventListener("click", () => {
        state.extraFields.push({ label: "N° CIN:", value: "" });
        renderExtraFieldsUI();
        renderCard();
    });

    // =========================================================================
    // PHOTO & CUSTOM LOGO UPLOAD + DRAG ON CANVAS + WEBCAM
    // =========================================================================
    function setupFileUploads() {
        // Personal Photo Upload
        const photoZone = document.getElementById("photo-dropzone");
        const photoInput = document.getElementById("inp-photo-file");

        photoZone?.addEventListener("click", () => photoInput?.click());
        photoZone?.addEventListener("dragover", (e) => {
            e.preventDefault();
            photoZone.classList.add("dragover");
        });
        photoZone?.addEventListener("dragleave", () => photoZone.classList.remove("dragover"));
        photoZone?.addEventListener("drop", (e) => {
            e.preventDefault();
            photoZone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                loadEmployeePhotoFile(e.dataTransfer.files[0]);
            }
        });
        photoInput?.addEventListener("change", () => {
            if (photoInput.files && photoInput.files[0]) {
                loadEmployeePhotoFile(photoInput.files[0]);
            }
        });

        document.getElementById("btn-photo-default")?.addEventListener("click", () => {
            state.photoMode = "default";
            state.photoDataUrl = "/static/assets/card/default_photo.jpg";
            renderCard();
            showToast("تمت استعادة صورة النموذج الأصلي");
        });

        document.getElementById("btn-photo-avatar")?.addEventListener("click", () => {
            state.photoMode = "avatar";
            renderCard();
            showToast("تم تفعيل الصورة الرمزية");
        });

        document.getElementById("btn-reset-photo-pos")?.addEventListener("click", () => {
            state.photoZoom = 1.0;
            state.photoOffsetX = 0;
            state.photoOffsetY = 0;
            state.photoBrightness = 100;
            state.photoContrast = 100;
            syncUIFromState();
            renderCard();
        });

        // Custom Company Logo Upload
        const logoZone = document.getElementById("logo-dropzone");
        const logoInput = document.getElementById("inp-logo-file");

        logoZone?.addEventListener("click", () => logoInput?.click());
        logoZone?.addEventListener("dragover", (e) => {
            e.preventDefault();
            logoZone.classList.add("dragover");
        });
        logoZone?.addEventListener("dragleave", () => logoZone.classList.remove("dragover"));
        logoZone?.addEventListener("drop", (e) => {
            e.preventDefault();
            logoZone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                loadCustomLogoFile(e.dataTransfer.files[0]);
            }
        });
        logoInput?.addEventListener("change", () => {
            if (logoInput.files && logoInput.files[0]) {
                loadCustomLogoFile(logoInput.files[0]);
            }
        });

        // Custom Stamp Image Upload
        const btnUploadStamp = document.getElementById("btn-upload-stamp-img");
        const btnResetStampGen = document.getElementById("btn-reset-stamp-gen");
        const inpStampFile = document.getElementById("inp-stamp-file");

        btnUploadStamp?.addEventListener("click", () => inpStampFile?.click());
        inpStampFile?.addEventListener("change", () => {
            if (inpStampFile.files && inpStampFile.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dUrl = ev.target.result;
                    const sImg = new Image();
                    sImg.onload = () => {
                        images.customStamp = sImg;
                        state.customStampDataUrl = dUrl;
                        if (btnResetStampGen) btnResetStampGen.style.display = "inline-flex";
                        renderCard();
                        showToast("تم رفع صورة الختم بنجاح");
                    };
                    sImg.src = dUrl;
                };
                reader.readAsDataURL(inpStampFile.files[0]);
            }
        });

        btnResetStampGen?.addEventListener("click", () => {
            state.customStampDataUrl = null;
            images.customStamp = null;
            btnResetStampGen.style.display = "none";
            renderCard();
            showToast("تمت العودة للختم الدائري التلقائي");
        });

        // Interactive Dragging on Canvas to reposition Photo
        let isDraggingPhoto = false;
        let dragStartX = 0;
        let dragStartY = 0;

        canvas.addEventListener("mousedown", (e) => {
            isDraggingPhoto = true;
            dragStartX = e.clientX - (state.photoOffsetX || 0);
            dragStartY = e.clientY - (state.photoOffsetY || 0);
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDraggingPhoto) return;
            state.photoOffsetX = Math.max(-150, Math.min(150, Math.round(e.clientX - dragStartX)));
            state.photoOffsetY = Math.max(-150, Math.min(150, Math.round(e.clientY - dragStartY)));
            const rx = document.getElementById("rng-photo-x");
            const ry = document.getElementById("rng-photo-y");
            const vx = document.getElementById("val-photo-x");
            const vy = document.getElementById("val-photo-y");
            if (rx) rx.value = state.photoOffsetX;
            if (ry) ry.value = state.photoOffsetY;
            if (vx) vx.textContent = state.photoOffsetX;
            if (vy) vy.textContent = state.photoOffsetY;
            renderCard();
        });

        window.addEventListener("mouseup", () => {
            isDraggingPhoto = false;
        });
    }

    function loadEmployeePhotoFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                images.customPhoto = img;
                state.photoMode = "custom";
                state.photoDataUrl = dataUrl;
                state.photoZoom = 1.0;
                state.photoOffsetX = 0;
                state.photoOffsetY = 0;
                syncUIFromState();
                renderCard();
                showToast("تم تحديث الصورة الشخصية بنجاح");
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    function loadCustomLogoFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                images.customLogo = img;
                state.logoMode = "custom";
                state.customLogoDataUrl = dataUrl;
                syncUIFromState();
                renderCard();
                showToast("تم رفع رمز/شعار الشركة بنجاح");
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    // Webcam Capture Support
    let webcamStream = null;
    function setupWebcam() {
        const modal = document.getElementById("webcam-modal");
        const video = document.getElementById("webcam-video");

        document.getElementById("btn-open-webcam")?.addEventListener("click", async () => {
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 800 } });
                video.srcObject = webcamStream;
                modal.classList.add("open");
            } catch (err) {
                showToast("تعذر الوصول إلى الكاميرا. يرجى رفع صورة من الجهاز.");
            }
        });

        const stopWebcam = () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach((t) => t.stop());
                webcamStream = null;
            }
            modal.classList.remove("open");
        };

        document.getElementById("btn-close-webcam")?.addEventListener("click", stopWebcam);
        document.getElementById("btn-cancel-webcam")?.addEventListener("click", stopWebcam);

        document.getElementById("btn-capture-webcam")?.addEventListener("click", () => {
            if (!video.videoWidth) return;
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;
            tempCanvas.getContext("2d").drawImage(video, 0, 0);
            const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.92);
            const img = new Image();
            img.onload = () => {
                images.customPhoto = img;
                state.photoMode = "custom";
                state.photoDataUrl = dataUrl;
                renderCard();
                stopWebcam();
                showToast("تم التقاط الصورة الشخصية بنجاح");
            };
            img.src = dataUrl;
        });
    }

    // =========================================================================
    // EXPORT (PNG / JPG / JSON) & PRINTING (SINGLE CR80 / 8-UP A4 SHEET)
    // =========================================================================
    function setupExportAndPrint() {
        document.getElementById("btn-download-png")?.addEventListener("click", () => {
            const link = document.createElement("a");
            const cleanName = `${state.nom || "CARTE"}_${state.prenom || ""}_${state.matricule || ""}`.trim().replace(/\s+/g, "_");
            link.download = `Carte_Professionnelle_${cleanName}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showToast("تم تحميل البطاقة بصيغة PNG عالية الدقة");
        });

        document.getElementById("btn-download-jpg")?.addEventListener("click", () => {
            const link = document.createElement("a");
            const cleanName = `${state.nom || "CARTE"}_${state.prenom || ""}_${state.matricule || ""}`.trim().replace(/\s+/g, "_");
            link.download = `Carte_Professionnelle_${cleanName}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.96);
            link.click();
            showToast("تم تحميل البطاقة بصيغة JPG");
        });

        document.getElementById("btn-print-single")?.addEventListener("click", () => {
            triggerPrint(1);
        });

        document.getElementById("btn-print-a4")?.addEventListener("click", () => {
            triggerPrint(8);
        });

        document.getElementById("btn-print-all-saved")?.addEventListener("click", async () => {
            try {
                const res = await fetch("/api/cards");
                const data = await res.json();
                const cards = (data && data.cards) || [];
                if (cards.length <= 1) {
                    triggerPrint(8);
                    return;
                }
                const container = document.getElementById("print-sheet-container");
                if (!container) return;
                container.innerHTML = "";
                const backupState = JSON.parse(JSON.stringify(state));

                for (const c of cards.slice(0, 8)) {
                    state = { ...getDefaultState(), ...(c.card_data || {}) };
                    renderCard();
                    const img = document.createElement("img");
                    img.src = canvas.toDataURL("image/png");
                    img.className = "print-card-img";
                    container.appendChild(img);
                }

                state = backupState;
                renderCard();
                setTimeout(() => window.print(), 200);
            } catch (e) {
                triggerPrint(8);
            }
        });

        // Export & Import JSON Project
        document.getElementById("btn-export-json")?.addEventListener("click", () => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `card_${state.nom || "template"}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        const importBtn = document.getElementById("btn-import-json");
        const importInput = document.getElementById("inp-import-json-file");
        importBtn?.addEventListener("click", () => importInput?.click());
        importInput?.addEventListener("change", () => {
            if (!importInput.files || !importInput.files[0]) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    applyLoadedCardData(imported);
                    showToast("تم استيراد بيانات البطاقة بنجاح");
                } catch (err) {
                    showToast("ملف JSON غير صالح");
                }
            };
            reader.readAsText(importInput.files[0]);
        });
    }

    function triggerPrint(count) {
        const container = document.getElementById("print-sheet-container");
        if (!container) return;
        const dataUrl = canvas.toDataURL("image/png");
        container.innerHTML = "";
        for (let i = 0; i < count; i++) {
            const img = document.createElement("img");
            img.src = dataUrl;
            img.className = "print-card-img";
            container.appendChild(img);
        }
        setTimeout(() => {
            window.print();
        }, 150);
    }

    // =========================================================================
    // DATABASE SAVE / LOAD / DELETE EMPLOYEE CARDS
    // =========================================================================
    async function loadSavedCardsList() {
        const listEl = document.getElementById("saved-cards-list");
        if (!listEl) return;
        try {
            const res = await fetch("/api/cards");
            const data = await res.json();
            if (!data.success) return;
            const cards = data.cards || [];
            if (cards.length === 0) {
                listEl.innerHTML = `<p style="font-size:0.8rem; color:var(--text-secondary);">لا توجد بطاقات محفوظة بعد.</p>`;
                return;
            }
            listEl.innerHTML = "";
            cards.forEach((c) => {
                const item = document.createElement("div");
                item.className = "saved-card-item";
                const cd = c.card_data || {};
                item.innerHTML = `
                    <div class="saved-card-info">
                        <h5>${escapeHtml(c.title)}</h5>
                        <small>${escapeHtml(cd.companyName || "")} • ${escapeHtml(cd.fonction || "")} • ${escapeHtml(cd.wilaya || "")}</small>
                    </div>
                    <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="btn btn-outline btn-sm btn-load-card" title="فتح وتعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button type="button" class="btn btn-danger btn-sm btn-del-card" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                item.querySelector(".saved-card-info").addEventListener("click", () => {
                    applyLoadedCardData({ ...cd, id: c.id });
                    showToast(`تم تحميل بطاقة: ${c.title}`);
                });
                item.querySelector(".btn-load-card").addEventListener("click", () => {
                    applyLoadedCardData({ ...cd, id: c.id });
                    showToast(`تم تحميل بطاقة: ${c.title}`);
                });
                item.querySelector(".btn-del-card").addEventListener("click", async () => {
                    await fetch(`/api/cards/${c.id}`, { method: "DELETE" });
                    loadSavedCardsList();
                    showToast("تم حذف البطاقة");
                });
                listEl.appendChild(item);
            });
        } catch (err) {
            // Offline / standalone fallback
        }
    }

    async function saveCurrentCardToDB() {
        const title = `${state.nom || ""} ${state.prenom || ""} — ${state.matricule || ""}`.trim() || "بطاقة موظف";
        try {
            const res = await fetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: state.id || null,
                    title: title,
                    card_data: state
                })
            });
            const data = await res.json();
            if (data.success) {
                state.id = data.id;
                loadSavedCardsList();
                showToast("تم حفظ البطاقة في السجل بنجاح!");
            }
        } catch (err) {
            localStorage.setItem("saved_id_card_backup", JSON.stringify(state));
            showToast("تم حفظ البطاقة محلياً بنجاح!");
        }
    }

    function applyLoadedCardData(loaded) {
        state = { ...getDefaultState(), ...loaded };
        if (state.photoMode === "custom" && state.photoDataUrl) {
            const img = new Image();
            img.onload = () => {
                images.customPhoto = img;
                renderCard();
            };
            img.src = state.photoDataUrl;
        }
        if (state.logoMode === "custom" && state.customLogoDataUrl) {
            const img = new Image();
            img.onload = () => {
                images.customLogo = img;
                renderCard();
            };
            img.src = state.customLogoDataUrl;
        }
        syncUIFromState();
        renderExtraFieldsUI();
        renderCard();
    }

    function syncUIFromState() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        setVal("inp-nom", state.nom);
        setVal("inp-prenom", state.prenom);
        setVal("inp-matricule", state.matricule);
        setVal("inp-groupe-sanguin", state.groupeSanguin);
        setVal("sel-blood", state.groupeSanguin);
        setVal("inp-fonction", state.fonction);
        setVal("inp-wilaya", state.wilaya);
        setVal("inp-date-expiration", state.dateExpiration);

        setVal("lbl-nom", state.labelNom);
        setVal("lbl-prenom", state.labelPrenom);
        setVal("lbl-matricule", state.labelMatricule);
        setVal("lbl-groupe", state.labelGroupeSanguin);
        setVal("lbl-fonction", state.labelFonction);
        setVal("lbl-expiration", state.labelDateExpiration);
        setVal("lbl-wilaya", state.labelWilaya);
        setVal("sel-fields-dir", state.fieldsDirection);

        setVal("inp-company-name", state.companyName);
        setVal("sel-header-style", state.headerStyle);
        setVal("rng-company-size", state.companyFontSize);
        setVal("inp-company-subtitle", state.companySubtitle);
        setVal("inp-card-title", state.cardTitle);

        setVal("inp-shield-ar", state.shieldArabic);
        setVal("inp-shield-l1", state.shieldLine1);
        setVal("inp-shield-l2", state.shieldLine2);
        setVal("inp-shield-left", state.shieldLeft);
        setVal("inp-shield-right", state.shieldRight);

        setVal("clr-shield-primary", state.shieldPrimaryColor);
        setVal("clr-shield-accent", state.shieldAccentColor);
        setVal("clr-shield-inner", state.shieldInnerBg);

        setVal("rng-photo-zoom", state.photoZoom);
        setVal("rng-photo-x", state.photoOffsetX);
        setVal("rng-photo-y", state.photoOffsetY);
        setVal("rng-photo-bright", state.photoBrightness);
        setVal("rng-photo-contrast", state.photoContrast);
        setVal("sel-photo-border", state.photoBorder);
        setVal("rng-photo-radius", state.photoRadius);

        const chkStamp = document.getElementById("chk-show-stamp");
        if (chkStamp) chkStamp.checked = !!state.showStamp;

        setVal("inp-stamp-top", state.stampTopText);
        setVal("inp-stamp-bottom", state.stampBottomText);
        setVal("inp-stamp-center", state.stampCenterText);
        setVal("clr-stamp", state.stampColor);
        setVal("rng-stamp-opacity", state.stampOpacity);
        setVal("rng-stamp-angle", state.stampAngle);

        setVal("clr-card-bg", state.cardBgColor);
        setVal("clr-header-outline", state.headerOutlineColor);
        setVal("clr-banner-bg", state.bannerBgColor);
        setVal("clr-label", state.labelColor);
        setVal("clr-value", state.valueColor);
        setVal("rng-fields-size", state.fieldsFontSize);

        // Sync logo mode pills
        document.querySelectorAll(".mode-pill[data-logo-mode]").forEach((b) => {
            b.classList.toggle("active", b.getAttribute("data-logo-mode") === state.logoMode);
        });
        const vecBox = document.getElementById("vector-shield-settings");
        const custBox = document.getElementById("custom-logo-settings");
        if (vecBox) vecBox.style.display = state.logoMode === "vector" ? "block" : "none";
        if (custBox) custBox.style.display = state.logoMode === "custom" ? "block" : "none";
    }

    // =========================================================================
    // TABS, SIDE SWITCHER & GENERAL ACTIONS
    // =========================================================================
    function setupNavigation() {
        // Control Sidebar Tabs
        document.querySelectorAll(".tab-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
                document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
                btn.classList.add("active");
                const target = document.getElementById(btn.getAttribute("data-tab"));
                if (target) target.classList.add("active");
            });
        });

        // Front / Back Card View Switch
        const btnFront = document.getElementById("btn-view-front");
        const btnBack = document.getElementById("btn-view-back");
        btnFront?.addEventListener("click", () => {
            state.activeSide = "front";
            btnFront.classList.add("active");
            btnBack?.classList.remove("active");
            renderCard();
        });
        btnBack?.addEventListener("click", () => {
            state.activeSide = "back";
            btnBack.classList.add("active");
            btnFront?.classList.remove("active");
            renderCard();
        });

        // Reference Photo Comparison Drawer Toggle
        const refBox = document.getElementById("reference-compare-box");
        document.getElementById("btn-toggle-reference")?.addEventListener("click", () => {
            refBox?.classList.toggle("visible");
        });
        document.getElementById("btn-close-reference")?.addEventListener("click", () => {
            refBox?.classList.remove("visible");
        });

        // Save Card button
        document.getElementById("btn-save-card-db")?.addEventListener("click", saveCurrentCardToDB);

        // Quick Toolbar Upload Buttons (Logo & Personal Photo)
        document.getElementById("btn-quick-upload-logo")?.addEventListener("click", () => {
            document.getElementById("inp-logo-file")?.click();
        });
        document.getElementById("btn-quick-upload-photo")?.addEventListener("click", () => {
            document.getElementById("inp-photo-file")?.click();
        });

        // Company Presets: S.S.G LILHIRASSA WA ELAMEN vs SARL AL-AMINE GARD
        document.getElementById("btn-preset-ssg")?.addEventListener("click", () => {
            state.companyName = "S.S.G LILHIRASSA WA ELAMEN";
            state.companyFontSize = 54;
            state.shieldArabic = "للحراسة والأمن";
            state.shieldLine1 = "S.S.G";
            state.shieldLine2 = "ELAMEN";
            state.stampTopText = "S.S.G LILHIRASSA WA ELAMEN";
            syncUIFromState();
            renderCard();
            showToast("تم تطبيق اسم وشعار شركة S.S.G LILHIRASSA WA ELAMEN");
        });

        document.getElementById("btn-preset-alamine")?.addEventListener("click", () => {
            state.companyName = "SARL AL-AMINE GARD";
            state.companyFontSize = 64;
            state.shieldArabic = "الأمين";
            state.shieldLine1 = "AL-AMINE";
            state.shieldLine2 = "GARD";
            state.stampTopText = "SARL AL-AMINE GARD";
            syncUIFromState();
            renderCard();
            showToast("تم تطبيق اسم وشعار شركة SARL AL-AMINE GARD");
        });

        // Direct Drag-and-Drop onto the Card Canvas (Left = Company Logo, Right = Personal Photo)
        canvas.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        canvas.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;
            const rect = canvas.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
            if (relX < 0.38) {
                loadCustomLogoFile(e.dataTransfer.files[0]);
            } else {
                loadEmployeePhotoFile(e.dataTransfer.files[0]);
            }
        });

        // Reset to Default Original Card
        document.getElementById("btn-reset-default")?.addEventListener("click", () => {
            applyLoadedCardData(getDefaultState());
            showToast("تمت استعادة النموذج الافتراضي للبطاقة");
        });

        // New Blank Employee Card (keeping company & logo settings)
        document.getElementById("btn-new-blank-card")?.addEventListener("click", () => {
            state.id = null;
            state.nom = "";
            state.prenom = "";
            state.matricule = "";
            state.photoMode = "avatar";
            syncUIFromState();
            renderCard();
            document.querySelector('.tab-btn[data-tab="tab-employee"]')?.click();
            document.getElementById("inp-nom")?.focus();
            showToast("جاهز لإدخال بيانات موظف جديد");
        });

        // Light / Dark Theme Toggle
        document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
        });
    }

    function showToast(msg) {
        const toast = document.getElementById("toast-msg");
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // Initialize everything
    bindInputsToState();
    setupFileUploads();
    setupWebcam();
    setupExportAndPrint();
    setupNavigation();
    loadSavedCardsList();
    renderCard();
})();
