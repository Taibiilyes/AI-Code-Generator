/**
 * Professional ID Card Maker Studio — برنامج صنع بطاقات التعريف الوظيفية
 * S.S.G LILHIRASSA WA ELAMEN
 * High-Resolution HTML5 Canvas Engine (2560x1400 Card + 2480x3508 300-DPI A4 Batch & PDF Engine)
 */

(function () {
    "use strict";

    const LOCAL_QUEUE_KEY = "ssg_id_cards_queue_v2";
    const PX_PER_MM_300DPI = 300 / 25.4; // 11.8110236 px/mm -> 2480 x 3508 px for 210x297mm A4

    // Default state: S.S.G LILHIRASSA WA ELAMEN with enhanced original shield integrated
    // and ALL personal information + personal photo completely cleared.
    function getDefaultState() {
        return {
            id: null,
            companyName: "S.S.G LILHIRASSA WA ELAMEN",
            headerStyle: "hollow", // hollow | double | solid-outline | solid
            companyFontSize: 54,
            companySubtitle: "Société de Gardiennage et d'Escort de Fonds et de Produits Sensibles",
            cardTitle: "CARTE PROFESSIONNELLE",

            // Integrated enhanced company shield logo (colors & borders enhanced, original design & texts preserved)
            logoMode: "extracted", // extracted | custom | vector
            logoScale: 1.0,
            logoOffsetX: 0,
            logoContrast: 100,
            logoSaturation: 100,
            logoBrightness: 100,
            logoBorderStyle: "clean", // clean | gold-rim | dark-rim | soft-shadow

            shieldArabic: "للحراسة والأمن",
            shieldLine1: "S.S.G",
            shieldLine2: "ELAMEN",
            shieldLeft: "PROTECTION",
            shieldRight: "SÉCURITÉ",
            shieldPrimaryColor: "#181b1f",
            shieldAccentColor: "#f5c518",
            shieldInnerBg: "#f4f5f3",
            customLogoDataUrl: null,

            // Employee fields — ALL CLEARED BY DEFAULT
            nom: "",
            prenom: "",
            matricule: "",
            groupeSanguin: "",
            fonction: "",
            dateExpiration: "",
            wilaya: "",

            // Field labels (matching reference template layout)
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

            // Personal photo — CLEARED BY DEFAULT (no employee portrait)
            photoMode: "blank", // blank | custom | avatar
            photoDataUrl: null,
            photoZoom: 1.0,
            photoOffsetX: 0,
            photoOffsetY: 0,
            photoBrightness: 100,
            photoContrast: 100,
            photoBorder: "none",
            photoRadius: 0,

            // Company Circular Stamp (Cachet)
            showStamp: true,
            stampTopText: "S.S.G LILHIRASSA WA ELAMEN",
            stampBottomText: "GARDIENNAGE & SÉCURITÉ",
            stampCenterText: "SÉCURITÉ",
            stampColor: "#cc3b42",
            stampOpacity: 0.16,
            stampAngle: -75,
            stampX: 805,
            stampY: 455,
            customStampDataUrl: null,

            // Card Colors
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

            // Active Stage View & Aspect Mode
            activeSide: "front", // front | back | a4-front | a4-back
            aspectMode: "model"  // model (1280x700) | cr80 (1200x757)
        };
    }

    // A4 Multi-Worker Layout & Formatting Settings
    function getDefaultA4Config() {
        return {
            preset: "2x4",
            cols: 2,
            rows: 4,
            orientation: "portrait", // portrait (210x297mm) | landscape (297x210mm)
            cardWidthMm: 85.6,
            cardHeightMm: 54.0,
            gapXMm: 6.0,
            gapYMm: 6.0,
            autoCenter: true,
            marginXMm: 16.4,
            marginYMm: 31.5,
            cropMarks: true,
            duplexMirror: true,
            backShiftXMm: 0,
            backShiftYMm: 0,
            batchMode: "saved_queue", // saved_queue | repeat_current
            repeatCount: 8
        };
    }

    let state = getDefaultState();
    let a4Config = getDefaultA4Config();
    let cachedSavedCards = [];

    const canvas = document.getElementById("card-canvas");
    const ctx = canvas.getContext("2d");

    // Preloaded images cache
    const images = {
        extractedShield: new Image(),
        customPhoto: null,
        customLogo: null,
        customStamp: null,
        dataUrlCache: new Map()
    };

    images.extractedShield.crossOrigin = "anonymous";
    images.extractedShield.onload = () => renderCard();
    images.extractedShield.src = "/static/assets/card/extracted_shield.png";

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => renderCard());
    }

    function getCachedImage(dataUrl) {
        if (!dataUrl) return null;
        if (images.dataUrlCache.has(dataUrl)) {
            return images.dataUrlCache.get(dataUrl);
        }
        const img = new Image();
        img.src = dataUrl;
        images.dataUrlCache.set(dataUrl, img);
        return img;
    }

    function ensureImageLoaded(dataUrl) {
        return new Promise((resolve) => {
            if (!dataUrl) {
                resolve(null);
                return;
            }
            const existing = images.dataUrlCache.get(dataUrl);
            if (existing && existing.complete && existing.naturalWidth > 0) {
                resolve(existing);
                return;
            }
            const img = new Image();
            img.onload = () => {
                images.dataUrlCache.set(dataUrl, img);
                resolve(img);
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
    }

    // =========================================================================
    // MAIN STAGE RENDER PIPELINE (Single Card OR Live A4 Sheet Preview)
    // =========================================================================
    function renderCard() {
        const wrapper = document.getElementById("canvas-wrapper");

        if (state.activeSide === "a4-front" || state.activeSide === "a4-back") {
            const isBack = state.activeSide === "a4-back";
            // Preview resolution for live smooth A4 canvas on screen (~1240x1754)
            const previewDpiScale = 150 / 25.4;
            const sheetWmm = a4Config.orientation === "landscape" ? 297 : 210;
            const sheetHmm = a4Config.orientation === "landscape" ? 210 : 297;
            const pw = Math.round(sheetWmm * previewDpiScale);
            const ph = Math.round(sheetHmm * previewDpiScale);

            if (canvas.width !== pw || canvas.height !== ph) {
                canvas.width = pw;
                canvas.height = ph;
            }
            if (wrapper) {
                wrapper.style.maxWidth = a4Config.orientation === "landscape" ? "860px" : "560px";
            }

            const batchCards = buildBatchCardStatesList();
            const perSheet = Math.max(1, a4Config.cols * a4Config.rows);
            const firstSheetCards = batchCards.slice(0, perSheet);
            drawA4PageOnContext(ctx, pw, ph, previewDpiScale, firstSheetCards, isBack ? "back" : "front", 1, Math.max(1, Math.ceil(batchCards.length / perSheet)));
            updateFooterResolutionLabel(pw * 2, ph * 2, true);
            return;
        }

        if (wrapper) {
            wrapper.style.maxWidth = "920px";
        }

        const logicalW = state.aspectMode === "cr80" ? 1200 : 1280;
        const logicalH = state.aspectMode === "cr80" ? 757 : 700;
        const scale = 2; // 2560 x 1400 px high-DPI master

        if (canvas.width !== logicalW * scale || canvas.height !== logicalH * scale) {
            canvas.width = logicalW * scale;
            canvas.height = logicalH * scale;
        }

        ctx.save();
        ctx.scale(scale, scale);

        if (state.activeSide === "back") {
            drawBackCardForState(ctx, logicalW, logicalH, state);
        } else {
            drawFrontCardForState(ctx, logicalW, logicalH, state);
        }

        ctx.restore();
        updateFooterResolutionLabel(logicalW * scale, logicalH * scale, false);
    }

    function updateFooterResolutionLabel(wPx, hPx, isA4) {
        const footerStrong = document.querySelector(".stage-footer strong");
        if (!footerStrong) return;
        if (isA4) {
            const perPage = Math.max(1, a4Config.cols * a4Config.rows);
            footerStrong.textContent = `ورقة A4 قياسية (${wPx} × ${hPx} px — 300 DPI — ${perPage} عمال في الورقة)`;
        } else {
            footerStrong.textContent = `${wPx} × ${hPx} px (300+ DPI جاهز للطباعة)`;
        }
    }

    function renderSingleCardOffscreen(cardState, side) {
        const logicalW = cardState.aspectMode === "cr80" ? 1200 : 1280;
        const logicalH = cardState.aspectMode === "cr80" ? 757 : 700;
        const scale = 2;
        const off = document.createElement("canvas");
        off.width = logicalW * scale;
        off.height = logicalH * scale;
        const octx = off.getContext("2d");
        octx.save();
        octx.scale(scale, scale);
        if (side === "back") {
            drawBackCardForState(octx, logicalW, logicalH, cardState);
        } else {
            drawFrontCardForState(octx, logicalW, logicalH, cardState);
        }
        octx.restore();
        return off;
    }

    // =========================================================================
    // FRONT CARD (RECTO) — Original Reference Layout + Enhanced SSG Logo
    // =========================================================================
    function drawFrontCardForState(ctx, W, H, s) {
        // 1. Card Background + Subtle Security Micro-line Texture
        ctx.fillStyle = s.cardBgColor || "#f4f5f3";
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.strokeStyle = "rgba(55, 123, 156, 0.012)";
        ctx.lineWidth = 1;
        for (let y = 8; y < H; y += 6) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Top Header: Company Name
        drawCompanyHeader(ctx, W, s);

        // 3. Company Activity Subtitle
        ctx.save();
        ctx.font = "700 22.5px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = "#232830";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.companySubtitle || "", W * 0.52, 122, W - 90);
        ctx.restore();

        // 4. Black Title Banner (CARTE PROFESSIONNELLE)
        const bannerX = 376;
        const bannerY = 150;
        const bannerW = W - bannerX - 24;
        const bannerH = 96;

        ctx.save();
        ctx.fillStyle = s.bannerBgColor || "#1c1f24";
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

        ctx.font = "600 44px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = s.bannerTextColor || "#f0f4f7";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "3px";
        }
        ctx.fillText(
            s.cardTitle || "CARTE PROFESSIONNELLE",
            bannerX + bannerW / 2,
            bannerY + bannerH / 2 + 2,
            bannerW - 30
        );
        ctx.restore();

        // 5. Left Company Shield / Logo (Enhanced SSG Shield integrated seamlessly)
        drawCompanyLogoSection(ctx, H, s);

        // 6. Employee Personal Photo Zone (Bottom Right — Clean/Blank until uploaded)
        const photoW = 304;
        const photoH = 368;
        const photoX = W - photoW - 38;
        const photoY = H - photoH - 22;
        drawEmployeePhoto(ctx, photoX, photoY, photoW, photoH, s);

        // 7. Faint Circular Company Rubber Stamp (Cachet)
        if (s.showStamp) {
            drawCompanyStamp(ctx, s.stampX, s.stampY, s);
        }

        // 8. Center Employee Information Fields (Nom, Prénom, Matricule...)
        drawEmployeeFields(ctx, bannerX + 8, 286, photoX - 18, H - 22, s);
    }

    // =========================================================================
    // COMPANY HEADER TITLE (Hollow Cyan-Blue Outlined Letters as in Original)
    // =========================================================================
    function drawCompanyHeader(ctx, W, s) {
        const text = (s.companyName || "").trim();
        if (!text) return;

        ctx.save();
        const fontSize = Number(s.companyFontSize) || 54;
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
        const outlineColor = s.headerOutlineColor || "#377b9c";
        const bgFill = s.cardBgColor || "#f4f5f3";

        if (s.headerStyle === "hollow") {
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
        } else if (s.headerStyle === "double") {
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 10;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.strokeText(text, centerX, centerY, maxW);

            ctx.fillStyle = outlineColor;
            ctx.fillText(text, centerX, centerY, maxW);
        } else if (s.headerStyle === "solid-outline") {
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
    // LEFT SHIELD LOGO — Preserves 100% Exact Proportions, Colors & Borders
    // =========================================================================
    function drawCompanyLogoSection(ctx, H, s) {
        const baseX = 16 + (Number(s.logoOffsetX) || 0);
        const baseY = 186;
        const baseW = 346;
        const baseH = H - baseY - 22;
        const scale = Number(s.logoScale) || 1.0;

        const cx = baseX + baseW / 2;
        const cy = baseY + baseH / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        if (s.logoMode === "extracted" && images.extractedShield.complete && images.extractedShield.naturalWidth > 0) {
            const img = images.extractedShield;
            // Strict proportional scaling so neither the shield nor the circle/eagle/texts distort by even 0.1%!
            const ratio = Math.min(baseW / img.naturalWidth, baseH / img.naturalHeight);
            const drawW = img.naturalWidth * ratio;
            const drawH = img.naturalHeight * ratio;
            const drawX = cx - drawW / 2;
            const drawY = cy - drawH / 2;

            const lContrast = Number(s.logoContrast) || 100;
            const lSat = Number(s.logoSaturation) || 100;
            const lBright = Number(s.logoBrightness) || 100;
            const bStyle = s.logoBorderStyle || "clean";

            let filterParts = [`contrast(${lContrast}%)`, `saturate(${lSat}%)`, `brightness(${lBright}%)`];
            if (bStyle === "gold-rim") {
                filterParts.push("drop-shadow(0px 0px 2.2px #f5c518)");
                filterParts.push("drop-shadow(0px 0px 1.2px #181a1d)");
            } else if (bStyle === "dark-rim") {
                filterParts.push("drop-shadow(0px 0px 2px #0f1114)");
            } else if (bStyle === "soft-shadow") {
                filterParts.push("drop-shadow(0px 4px 8px rgba(0,0,0,0.22))");
            }

            ctx.filter = filterParts.join(" ");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.filter = "none";
        } else if (s.logoMode === "custom") {
            const cImg = (s === state && images.customLogo) ? images.customLogo : getCachedImage(s.customLogoDataUrl);
            if (cImg && cImg.complete && cImg.naturalWidth > 0) {
                const ratio = Math.min(baseW / cImg.naturalWidth, baseH / cImg.naturalHeight);
                const drawW = cImg.naturalWidth * ratio;
                const drawH = cImg.naturalHeight * ratio;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(cImg, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
            } else if (images.extractedShield.complete && images.extractedShield.naturalWidth > 0) {
                const img = images.extractedShield;
                const ratio = Math.min(baseW / img.naturalWidth, baseH / img.naturalHeight);
                ctx.drawImage(img, cx - (img.naturalWidth * ratio) / 2, cy - (img.naturalHeight * ratio) / 2, img.naturalWidth * ratio, img.naturalHeight * ratio);
            }
        } else {
            drawVectorShield(ctx, cx, baseY, baseW, baseH, s);
        }

        ctx.restore();
    }

    function makeShieldPath(ctx, cx, topY, w, h) {
        const halfW = w / 2;
        const shoulderY = topY + h * 0.11;
        const bottomY = topY + h;

        ctx.beginPath();
        ctx.moveTo(cx - halfW + 8, shoulderY);
        ctx.quadraticCurveTo(cx, topY - h * 0.03, cx + halfW - 8, shoulderY);
        ctx.bezierCurveTo(
            cx + halfW + 6, topY + h * 0.46,
            cx + halfW * 0.56, topY + h * 0.80,
            cx, bottomY
        );
        ctx.bezierCurveTo(
            cx - halfW * 0.56, topY + h * 0.80,
            cx - halfW - 6, topY + h * 0.46,
            cx - halfW + 8, shoulderY
        );
        ctx.closePath();
    }

    function drawVectorShield(ctx, cx, topY, w, h, s) {
        const primary = s.shieldPrimaryColor || "#24333f";
        const accent = s.shieldAccentColor || "#59a1be";
        const innerBg = s.shieldInnerBg || "#c8e3ed";

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        makeShieldPath(ctx, cx, topY, w, h);
        ctx.fillStyle = primary;
        ctx.fill();
        ctx.shadowColor = "transparent";

        makeShieldPath(ctx, cx, topY + 15, w - 28, h - 32);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 12;
        ctx.lineJoin = "round";
        ctx.stroke();

        const arText = (s.shieldArabic || "").trim();
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

        drawCurvedText(
            ctx,
            (s.shieldLine1 || "").toUpperCase(),
            cx,
            topY + 315,
            235,
            "900 35px 'Orbitron', 'Exo 2', 'Montserrat', sans-serif",
            "#e3eff5",
            0.095
        );

        drawCurvedText(
            ctx,
            (s.shieldLine2 || "").toUpperCase(),
            cx,
            topY + 335,
            205,
            "900 35px 'Orbitron', 'Exo 2', 'Montserrat', sans-serif",
            "#e3eff5",
            0.095
        );

        const innerTop = topY + h * 0.36;
        const innerW = w * 0.58;
        const innerH = h * 0.47;

        makeShieldPath(ctx, cx, innerTop, innerW, innerH);
        ctx.fillStyle = innerBg;
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.stroke();

        const starCenterY = innerTop + innerH * 0.43;
        drawMainSplitStar(ctx, cx, starCenterY, 72, primary, innerBg);
        drawFivePointStar(ctx, cx - 50, starCenterY - 40, 15, 6.5, primary);
        drawFivePointStar(ctx, cx + 50, starCenterY - 40, 15, 6.5, primary);
        drawFivePointStar(ctx, cx, starCenterY + 74, 15, 6.5, primary);

        drawAngledShieldSideText(ctx, s.shieldLeft || "PROTECTION", cx - w * 0.255, topY + h * 0.65, 63.5 * (Math.PI / 180));
        drawAngledShieldSideText(ctx, s.shieldRight || "SÉCURITÉ", cx + w * 0.255, topY + h * 0.65, -63.5 * (Math.PI / 180));

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
    function drawEmployeeFields(ctx, leftX, topY, rightX, bottomY, s) {
        const rows = [
            { label: s.labelNom, value: s.nom },
            { label: s.labelPrenom, value: s.prenom },
            { label: s.labelMatricule, value: s.matricule },
            { label: s.labelGroupeSanguin, value: s.groupeSanguin },
            { label: s.labelFonction, value: s.fonction },
            { label: s.labelDateExpiration, value: s.dateExpiration },
            { label: s.labelWilaya, value: s.wilaya }
        ];

        if (Array.isArray(s.extraFields)) {
            s.extraFields.forEach((ef) => {
                if (ef && (ef.label || ef.value)) {
                    rows.push({ label: ef.label || "", value: ef.value || "" });
                }
            });
        }

        const totalRows = rows.length;
        const availableH = bottomY - topY;
        const stepY = Math.min(58, availableH / Math.max(totalRows, 1));
        const baseFontSize = Number(s.fieldsFontSize) || 34;
        const labelFontSize = Math.round(baseFontSize * 0.94);

        ctx.save();
        ctx.textBaseline = "middle";

        const isRTL = s.fieldsDirection === "rtl";

        rows.forEach((row, idx) => {
            const y = topY + idx * stepY + stepY * 0.42;
            const lbl = (row.label || "").trim();
            const val = (row.value || "").trim();

            if (!isRTL) {
                ctx.font = `700 ${labelFontSize}px 'Montserrat', 'Cairo', sans-serif`;
                ctx.fillStyle = s.labelColor || "#52667d";
                ctx.textAlign = "left";
                ctx.fillText(lbl, leftX, y);

                if (val) {
                    const lblWidth = ctx.measureText(lbl).width;
                    const valX = leftX + lblWidth + 22;
                    ctx.font = `800 ${baseFontSize}px 'Montserrat', 'Cairo', sans-serif`;
                    ctx.fillStyle = s.valueColor || "#22262c";
                    ctx.fillText(val, valX, y, Math.max(120, rightX - valX));
                }
            } else {
                ctx.font = `700 ${labelFontSize}px 'Cairo', 'Tajawal', sans-serif`;
                ctx.fillStyle = s.labelColor || "#52667d";
                ctx.textAlign = "right";
                ctx.fillText(lbl, rightX, y);

                if (val) {
                    const lblWidth = ctx.measureText(lbl).width;
                    const valX = rightX - lblWidth - 18;
                    ctx.font = `800 ${baseFontSize}px 'Cairo', 'Montserrat', sans-serif`;
                    ctx.fillStyle = s.valueColor || "#22262c";
                    ctx.fillText(val, valX, y, Math.max(120, valX - leftX));
                }
            }
        });

        ctx.restore();
    }

    // =========================================================================
    // EMPLOYEE PERSONAL PHOTO (Clean & Empty when cleared; High-DPI when uploaded)
    // =========================================================================
    function drawEmployeePhoto(ctx, x, y, w, h, s) {
        const radius = Number(s.photoRadius) || 0;
        const mode = s.photoMode || "blank";

        if (mode === "blank" || (mode === "custom" && !s.photoDataUrl)) {
            // Completely clean blank photo area (no old portrait image!)
            if (s.photoBorder === "thin") {
                ctx.save();
                roundedRectPath(ctx, x, y, w, h, radius);
                ctx.strokeStyle = "#24333f";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            } else if (s.photoBorder === "bold") {
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
            return;
        }

        ctx.save();
        roundedRectPath(ctx, x, y, w, h, radius);
        ctx.fillStyle = "#dfe5ec";
        ctx.fill();
        ctx.clip();

        if (mode === "avatar") {
            drawAvatarPlaceholder(ctx, x, y, w, h);
        } else {
            const pImg = (s === state && images.customPhoto) ? images.customPhoto : getCachedImage(s.photoDataUrl);
            if (pImg && pImg.complete && pImg.naturalWidth > 0) {
                const zoom = Number(s.photoZoom) || 1.0;
                const offX = Number(s.photoOffsetX) || 0;
                const offY = Number(s.photoOffsetY) || 0;
                const bright = Number(s.photoBrightness) || 100;
                const contrast = Number(s.photoContrast) || 100;

                ctx.filter = `brightness(${bright}%) contrast(${contrast}%)`;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                const scaleCover = Math.max(w / pImg.naturalWidth, h / pImg.naturalHeight) * zoom;
                const drawW = pImg.naturalWidth * scaleCover;
                const drawH = pImg.naturalHeight * scaleCover;
                const drawX = x + (w - drawW) / 2 + offX;
                const drawY = y + (h - drawH) / 2 + offY;

                ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
                ctx.filter = "none";
            }
        }

        ctx.restore();

        if (s.photoBorder === "thin") {
            ctx.save();
            roundedRectPath(ctx, x, y, w, h, radius);
            ctx.strokeStyle = "#24333f";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        } else if (s.photoBorder === "bold") {
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
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.36, w * 0.22, 0, Math.PI * 2);
        ctx.fill();
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
    // CIRCULAR COMPANY STAMP / CACHET
    // =========================================================================
    function drawCompanyStamp(ctx, cx, cy, s) {
        const radius = 152;
        const color = s.stampColor || "#cc3b42";
        const opacity = Number(s.stampOpacity) || 0.16;
        const angleRad = ((Number(s.stampAngle) || -75) * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);
        ctx.globalAlpha = opacity;

        const sImg = (s === state && images.customStamp) ? images.customStamp : getCachedImage(s.customStampDataUrl);
        if (s.customStampDataUrl && sImg && sImg.complete && sImg.naturalWidth > 0) {
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

        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 48, 0, Math.PI * 2);
        ctx.stroke();

        drawCurvedText(
            ctx,
            (s.stampTopText || "S.S.G LILHIRASSA WA ELAMEN").toUpperCase(),
            0,
            0,
            radius - 28,
            "800 18px 'Montserrat', sans-serif",
            color,
            0.105
        );

        const bottomStr = (s.stampBottomText || "GARDIENNAGE & SÉCURITÉ").toUpperCase();
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
            0.11
        );
        ctx.restore();

        ctx.lineWidth = 2.5;
        ctx.strokeRect(-86, -24, 172, 48);
        ctx.font = "900 28px 'Montserrat', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((s.stampCenterText || "SÉCURITÉ").toUpperCase(), 0, 1, 160);

        drawFivePointStar(ctx, -(radius - 28), 0, 8, 3.5, color);
        drawFivePointStar(ctx, radius - 28, 0, 8, 3.5, color);

        ctx.restore();
    }

    // =========================================================================
    // BACK SIDE OF CARD (VERSO) — Watermark SSG Logo + Legal Notice + Barcode
    // =========================================================================
    function drawBackCardForState(ctx, W, H, s) {
        ctx.fillStyle = s.cardBgColor || "#f4f5f3";
        ctx.fillRect(0, 0, W, H);

        // Subtle outer hairline border on back
        ctx.strokeStyle = "rgba(55, 123, 156, 0.14)";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, W - 20, H - 20);

        // Top dark header band
        ctx.fillStyle = s.bannerBgColor || "#1c1f24";
        ctx.fillRect(0, 42, W, 68);

        ctx.font = "800 30px 'Orbitron', 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.companyName || "S.S.G LILHIRASSA WA ELAMEN", W / 2, 76, W - 80);

        // Watermark Shield in Center
        ctx.save();
        ctx.globalAlpha = 0.09;
        if (s.logoMode === "extracted" && images.extractedShield.complete && images.extractedShield.naturalWidth > 0) {
            const img = images.extractedShield;
            const wmH = 380;
            const wmW = (img.naturalWidth / img.naturalHeight) * wmH;
            ctx.drawImage(img, (W - wmW) / 2, 138, wmW, wmH);
        } else {
            drawVectorShield(ctx, W / 2, 145, 260, 360, s);
        }
        ctx.restore();

        // Legal Notice Text
        ctx.save();
        ctx.font = "600 24px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        wrapText(ctx, s.backNotice || "", W / 2, 195, W - 180, 38);
        ctx.restore();

        // Barcode + Verification Box (Zero personal info unless entered by user)
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

        const fullName = `${s.nom || ""} ${s.prenom || ""}`.trim();
        const matStr = (s.matricule || "").trim();
        const codeStr = `${matStr || "SSG"}-${fullName || "GARDIENNAGE-SECURITE"}`;

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
        const idCaption = (matStr || fullName)
            ? `ID: ${matStr || "—"} | ${fullName}`
            : `${s.companyName || "S.S.G LILHIRASSA WA ELAMEN"}`;
        ctx.fillText(idCaption, W / 2, barY + barH + 22, barW + 20);
        ctx.restore();

        // Footer Contact Info
        ctx.save();
        ctx.font = "700 22px 'Montserrat', 'Cairo', sans-serif";
        ctx.fillStyle = s.labelColor || "#52667d";
        ctx.textAlign = "center";
        ctx.fillText(`${s.backAddress || ""}   •   Tél: ${s.backPhone || ""}`, W / 2, H - 45, W - 80);
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
    // A4 MULTI-WORKER SHEET LAYOUT, DUPLEX MIRRORING & 300-DPI PDF ENGINE
    // =========================================================================
    function buildBatchCardStatesList() {
        const perSheet = Math.max(1, a4Config.cols * a4Config.rows);
        if (a4Config.batchMode === "repeat_current") {
            const count = Math.max(1, Math.min(48, Number(a4Config.repeatCount) || perSheet));
            return Array.from({ length: count }, () => ({ ...state }));
        }

        if (cachedSavedCards.length > 0) {
            return cachedSavedCards.map((item) => ({
                ...getDefaultState(),
                ...(item.card_data || {})
            }));
        }

        // If no saved workers yet in the queue, fill one A4 sheet with the current template/card
        // so the user immediately previews and prints a full A4 sheet (e.g., 8 clean blank templates or current card!)
        return Array.from({ length: perSheet }, () => ({ ...state }));
    }

    function updateBatchBadgeCount() {
        const badge = document.getElementById("batch-total-badge");
        if (!badge) return;
        const perSheet = Math.max(1, a4Config.cols * a4Config.rows);
        const cards = buildBatchCardStatesList();
        const pages = Math.max(1, Math.ceil(cards.length / perSheet));
        if (a4Config.batchMode === "saved_queue" && cachedSavedCards.length > 0) {
            badge.textContent = `${cachedSavedCards.length} عامل (${pages} صفحة A4)`;
        } else {
            badge.textContent = `${cards.length} بطاقة (${pages} صفحة A4)`;
        }
    }

    function drawA4PageOnContext(targetCtx, pageWpx, pageHpx, pxPerMm, pageCardStates, side, pageIndex, totalPages) {
        // Pure white paper background
        targetCtx.save();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(0, 0, pageWpx, pageHpx);

        const sheetWmm = a4Config.orientation === "landscape" ? 297 : 210;
        const sheetHmm = a4Config.orientation === "landscape" ? 210 : 297;

        const cols = Math.max(1, Number(a4Config.cols) || 2);
        const rows = Math.max(1, Number(a4Config.rows) || 4);
        const cardWmm = Number(a4Config.cardWidthMm) || 85.6;
        const cardHmm = Number(a4Config.cardHeightMm) || 54.0;
        const gapXmm = Number(a4Config.gapXMm) || 0;
        const gapYmm = Number(a4Config.gapYMm) || 0;

        const gridTotalWmm = cols * cardWmm + (cols - 1) * gapXmm;
        const gridTotalHmm = rows * cardHmm + (rows - 1) * gapYmm;

        let startXmm = a4Config.autoCenter ? (sheetWmm - gridTotalWmm) / 2 : (Number(a4Config.marginXMm) || 10);
        let startYmm = a4Config.autoCenter ? (sheetHmm - gridTotalHmm) / 2 : (Number(a4Config.marginYMm) || 15);

        // Apply optional back-side printer alignment calibration shift (mm)
        if (side === "back") {
            startXmm += Number(a4Config.backShiftXMm) || 0;
            startYmm += Number(a4Config.backShiftYMm) || 0;
        }

        const cardWpx = cardWmm * pxPerMm;
        const cardHpx = cardHmm * pxPerMm;

        // Subtle sheet header micro-guide (outside cut area near top 5mm margin)
        if (startYmm >= 9) {
            targetCtx.save();
            targetCtx.fillStyle = "#64748b";
            targetCtx.font = `600 ${Math.round(2.7 * pxPerMm)}px 'Cairo', 'Montserrat', sans-serif`;
            targetCtx.textAlign = "center";
            targetCtx.textBaseline = "middle";
            const sideAr = side === "back"
                ? "ورقة الأوجه الخلفية (VERSO — محاذاة الطباعة المزدوجة)"
                : "ورقة الأوجه الأمامية (RECTO)";
            targetCtx.fillText(
                `${state.companyName || "S.S.G"} — ${sideAr} — صفحة ${pageIndex}/${totalPages} (${cardWmm}×${cardHmm} mm)`,
                pageWpx / 2,
                Math.max(4.5 * pxPerMm, (startYmm * pxPerMm) * 0.42)
            );
            targetCtx.restore();
        }

        for (let idx = 0; idx < pageCardStates.length; idx++) {
            const cState = pageCardStates[idx];
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            if (row >= rows) break;

            // Mirror column horizontally on Back sheet when Duplex Mirror is active
            // so Front Card [row, col] aligns 100% behind Back Card [row, cols - 1 - col] when flipping A4 long-edge!
            const effectiveCol = (side === "back" && a4Config.duplexMirror) ? (cols - 1 - col) : col;

            const xMm = startXmm + effectiveCol * (cardWmm + gapXmm);
            const yMm = startYmm + row * (cardHmm + gapYmm);

            const xPx = xMm * pxPerMm;
            const yPx = yMm * pxPerMm;

            const cardCanvas = renderSingleCardOffscreen(cState, side);
            targetCtx.imageSmoothingEnabled = true;
            targetCtx.imageSmoothingQuality = "high";
            targetCtx.drawImage(cardCanvas, xPx, yPx, cardWpx, cardHpx);

            // Light hairline border around card perimeter to guide clean trimming
            targetCtx.strokeStyle = "rgba(100, 116, 139, 0.32)";
            targetCtx.lineWidth = Math.max(1, 0.15 * pxPerMm);
            targetCtx.strokeRect(xPx, yPx, cardWpx, cardHpx);

            // Precision corner crop marks outside the card area
            if (a4Config.cropMarks) {
                drawCardCropMarks(targetCtx, xPx, yPx, cardWpx, cardHpx, pxPerMm);
            }
        }

        targetCtx.restore();
    }

    function drawCardCropMarks(targetCtx, x, y, w, h, pxPerMm) {
        const offset = 0.8 * pxPerMm;
        const len = Math.min(2.6 * pxPerMm, 18);
        targetCtx.save();
        targetCtx.strokeStyle = "#334155";
        targetCtx.lineWidth = Math.max(1, 0.2 * pxPerMm);

        const corners = [
            [x, y, -1, -1],
            [x + w, y, 1, -1],
            [x, y + h, -1, 1],
            [x + w, y + h, 1, 1]
        ];

        corners.forEach(([cx, cy, dx, dy]) => {
            targetCtx.beginPath();
            targetCtx.moveTo(cx + dx * offset, cy);
            targetCtx.lineTo(cx + dx * (offset + len), cy);
            targetCtx.moveTo(cx, cy + dy * offset);
            targetCtx.lineTo(cx, cy + dy * (offset + len));
            targetCtx.stroke();
        });
        targetCtx.restore();
    }

    async function preloadBatchImages(cardStates) {
        const promises = [];
        cardStates.forEach((cs) => {
            if (cs.photoMode === "custom" && cs.photoDataUrl) {
                promises.push(ensureImageLoaded(cs.photoDataUrl));
            }
            if (cs.logoMode === "custom" && cs.customLogoDataUrl) {
                promises.push(ensureImageLoaded(cs.customLogoDataUrl));
            }
            if (cs.customStampDataUrl) {
                promises.push(ensureImageLoaded(cs.customStampDataUrl));
            }
        });
        await Promise.all(promises);
    }

    /**
     * Generates full 300-DPI A4 page JPEG Data URLs for:
     *   mode === "fronts" -> all Front A4 sheets in one batch
     *   mode === "backs"  -> all Back A4 sheets in one batch (mirrored for duplex alignment)
     *   mode === "both"   -> interleaved [Front 1, Back 1, Front 2, Back 2, ...]
     */
    async function generate300DpiA4Pages(mode) {
        const allCards = buildBatchCardStatesList();
        await preloadBatchImages(allCards);

        const perSheet = Math.max(1, (Number(a4Config.cols) || 2) * (Number(a4Config.rows) || 4));
        const totalGroups = Math.max(1, Math.ceil(allCards.length / perSheet));

        const sheetWmm = a4Config.orientation === "landscape" ? 297 : 210;
        const sheetHmm = a4Config.orientation === "landscape" ? 210 : 297;
        const pageWpx = Math.round(sheetWmm * PX_PER_MM_300DPI); // 2480 px
        const pageHpx = Math.round(sheetHmm * PX_PER_MM_300DPI); // 3508 px

        const results = [];

        for (let g = 0; g < totalGroups; g++) {
            const groupCards = allCards.slice(g * perSheet, (g + 1) * perSheet);

            if (mode === "fronts" || mode === "both") {
                const c = document.createElement("canvas");
                c.width = pageWpx;
                c.height = pageHpx;
                drawA4PageOnContext(c.getContext("2d"), pageWpx, pageHpx, PX_PER_MM_300DPI, groupCards, "front", g + 1, totalGroups);
                results.push({
                    label: `صفحة ${g + 1} — الأوجه الأمامية (${groupCards.length} بطاقات)`,
                    dataUrl: c.toDataURL("image/jpeg", 0.94),
                    widthPx: pageWpx,
                    heightPx: pageHpx
                });
            }

            if (mode === "backs" || mode === "both") {
                const c = document.createElement("canvas");
                c.width = pageWpx;
                c.height = pageHpx;
                drawA4PageOnContext(c.getContext("2d"), pageWpx, pageHpx, PX_PER_MM_300DPI, groupCards, "back", g + 1, totalGroups);
                results.push({
                    label: `صفحة ${g + 1} — الأوجه الخلفية (${groupCards.length} بطاقات)`,
                    dataUrl: c.toDataURL("image/jpeg", 0.94),
                    widthPx: pageWpx,
                    heightPx: pageHpx
                });
            }
        }

        return results;
    }

    /**
     * Pure Client-Side Multi-Page ISO A4 PDF Generator (%PDF-1.4 with native /DCTDecode JPEG streams).
     * Works 100% offline with exact physical A4 dimensions (210x297mm = 595.28x841.89pt).
     */
    function buildPdfBytesFromJpegPages(pages, orientation) {
        const ptPerMm = 72 / 25.4;
        const pageWpt = Number(((orientation === "landscape" ? 297 : 210) * ptPerMm).toFixed(2));
        const pageHpt = Number(((orientation === "landscape" ? 210 : 297) * ptPerMm).toFixed(2));

        const encoder = new TextEncoder();
        const chunks = [];
        let offset = 0;

        function pushStr(s) {
            const bytes = encoder.encode(s);
            chunks.push(bytes);
            offset += bytes.length;
        }
        function pushBytes(b) {
            chunks.push(b);
            offset += b.length;
        }

        // Object IDs:
        // 1: Catalog
        // 2: Pages
        // For page i (0..N-1):
        //   imgObjId  = 3 + i*3
        //   contObjId = 4 + i*3
        //   pageObjId = 5 + i*3
        const totalObjs = 2 + pages.length * 3;
        const xrefOffsets = new Array(totalObjs + 1).fill(0);

        pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

        const pageObjIds = [];
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            const b64 = p.dataUrl.split(",")[1];
            const rawBin = atob(b64);
            const jpgBytes = new Uint8Array(rawBin.length);
            for (let k = 0; k < rawBin.length; k++) {
                jpgBytes[k] = rawBin.charCodeAt(k);
            }

            const imgObjId = 3 + i * 3;
            const contObjId = 4 + i * 3;
            const pageObjId = 5 + i * 3;
            pageObjIds.push(pageObjId);

            // Image XObject
            xrefOffsets[imgObjId] = offset;
            pushStr(
                `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`
            );
            pushBytes(jpgBytes);
            pushStr("\nendstream\nendobj\n");

            // Page Content Stream placing image at exact A4 physical size
            const drawCmd = `q\n${pageWpt} 0 0 ${pageHpt} 0 0 cm\n/Im${i} Do\nQ\n`;
            const drawBytes = encoder.encode(drawCmd);
            xrefOffsets[contObjId] = offset;
            pushStr(`${contObjId} 0 obj\n<< /Length ${drawBytes.length} >>\nstream\n`);
            pushBytes(drawBytes);
            pushStr("\nendstream\nendobj\n");

            // Page Object
            xrefOffsets[pageObjId] = offset;
            pushStr(
                `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWpt} ${pageHpt}] /Resources << /XObject << /Im${i} ${imgObjId} 0 R >> >> /Contents ${contObjId} 0 R >>\nendobj\n`
            );
        }

        // Pages Root Object (2)
        xrefOffsets[2] = offset;
        pushStr(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);

        // Catalog Object (1)
        xrefOffsets[1] = offset;
        pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // XRef Table
        const startXref = offset;
        pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
        for (let id = 1; id <= totalObjs; id++) {
            pushStr(`${String(xrefOffsets[id]).padStart(10, "0")} 00000 n \n`);
        }
        pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`);

        const out = new Uint8Array(offset);
        let pos = 0;
        for (const ch of chunks) {
            out.set(ch, pos);
            pos += ch.length;
        }
        return out;
    }

    function applyDynamicPageOrientationRule() {
        let styleEl = document.getElementById("dynamic-a4-print-rule");
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "dynamic-a4-print-rule";
            document.head.appendChild(styleEl);
        }
        const orient = a4Config.orientation === "landscape" ? "landscape" : "portrait";
        const wMm = orient === "landscape" ? "297mm" : "210mm";
        const hMm = orient === "landscape" ? "210mm" : "297mm";
        styleEl.textContent = `
            @media print {
                @page { size: A4 ${orient}; margin: 0mm; }
                .print-a4-page-img { width: ${wMm} !important; height: ${hMm} !important; }
            }
        `;
    }

    async function printBatchA4Sheets(mode) {
        showToast(mode === "backs"
            ? "جاري تجهيز جميع الأوجه الخلفية للطباعة بدقة 300 DPI..."
            : "جاري تجهيز جميع الأوجه الأمامية للطباعة بدقة 300 DPI...");

        applyDynamicPageOrientationRule();
        const pages = await generate300DpiA4Pages(mode);
        const container = document.getElementById("print-sheet-container");
        if (!container) return;

        container.innerHTML = "";
        const loadPromises = pages.map((p) => {
            return new Promise((resolve) => {
                const img = document.createElement("img");
                img.className = "print-a4-page-img";
                img.onload = resolve;
                img.onerror = resolve;
                img.src = p.dataUrl;
                container.appendChild(img);
            });
        });

        await Promise.all(loadPromises);
        setTimeout(() => {
            window.print();
        }, 120);
    }

    async function exportBatchA4Pdf(mode) {
        const pdfModal = document.getElementById("pdf-export-modal");
        const banner = document.getElementById("pdf-ready-banner");
        const dlLink = document.getElementById("pdf-server-download-link");
        const viewLink = document.getElementById("pdf-server-view-link");
        const grid = document.getElementById("pdf-pages-preview-grid");

        if (pdfModal) pdfModal.classList.add("open");
        if (banner) banner.style.display = "none";
        if (grid) {
            grid.innerHTML = `<div style="grid-column:1/-1; padding:1.2rem; color:var(--accent-primary); font-weight:800;">
                <i class="fa-solid fa-spinner fa-spin"></i> جاري توليد صفحات A4 بدقة 300 DPI وتجهيز ملف PDF...
            </div>`;
        }

        const suffix = mode === "fronts" ? "Recto_Fronts" : mode === "backs" ? "Verso_Backs" : "Recto_Verso_Complet";
        const fileName = `SSG_Cartes_A4_${suffix}.pdf`;

        const pages = await generate300DpiA4Pages(mode);
        const pdfBytes = buildPdfBytesFromJpegPages(pages, a4Config.orientation);
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Set local blob fallback links immediately (works offline & in standalone HTML)
        if (dlLink) {
            dlLink.href = blobUrl;
            dlLink.download = fileName;
        }
        if (viewLink) {
            viewLink.href = blobUrl;
        }

        // Also send to Flask backend /api/export-pdf when online so top-level server URL works inside sandboxed iframes
        try {
            const resp = await fetch("/api/export-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: fileName,
                    pages: pages.map((p) => p.dataUrl)
                })
            });
            const resJson = await resp.json();
            if (resJson && resJson.success && resJson.download_url) {
                if (dlLink) {
                    dlLink.href = resJson.download_url;
                    dlLink.removeAttribute("download");
                }
                if (viewLink) {
                    viewLink.href = `${resJson.download_url}?inline=1`;
                }
            }
        } catch (err) {
            // Standalone offline mode uses blobUrl seamlessly
        }

        if (banner) banner.style.display = "block";

        // Trigger automatic download attempt as well
        try {
            const autoA = document.createElement("a");
            autoA.href = blobUrl;
            autoA.download = fileName;
            autoA.click();
        } catch (e) {
            // Ignored if sandbox blocks automatic download; modal link is visible right in front of user
        }

        if (grid) {
            grid.innerHTML = "";
            pages.forEach((p) => {
                const box = document.createElement("div");
                box.style.cssText = "background:var(--bg-input); border:1px solid var(--border-color); border-radius:10px; padding:0.6rem; text-align:center;";
                box.innerHTML = `
                    <div style="font-size:0.78rem; font-weight:800; margin-bottom:0.4rem; color:var(--text-primary);">${escapeHtml(p.label)}</div>
                    <img src="${p.dataUrl}" alt="${escapeHtml(p.label)}" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; background:#fff;">
                `;
                grid.appendChild(box);
            });
        }

        showToast(`تم إنشاء ملف PDF (${pages.length} صفحة A4 بدقة 300 DPI)`);
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

        const selBlood = document.getElementById("sel-blood");
        const inpBlood = document.getElementById("inp-groupe-sanguin");
        if (selBlood && inpBlood) {
            selBlood.addEventListener("change", () => {
                inpBlood.value = selBlood.value;
                state.groupeSanguin = selBlood.value;
                renderCard();
            });
        }

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

        // 1-Click Clear All Personal Info & Personal Photo
        document.getElementById("btn-clear-all-personal")?.addEventListener("click", () => {
            state.id = null;
            state.nom = "";
            state.prenom = "";
            state.matricule = "";
            state.groupeSanguin = "";
            state.fonction = "";
            state.dateExpiration = "";
            state.wilaya = "";
            state.extraFields = [];
            state.photoMode = "blank";
            state.photoDataUrl = null;
            images.customPhoto = null;
            syncUIFromState();
            renderExtraFieldsUI();
            renderCard();
            showToast("تم مسح كافة المعلومات الشخصية والصورة الشخصية");
        });

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
            showToast("تم ضبط عناوين الحقول باللغة الفرنسية");
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

        const selectBindings = [
            ["sel-fields-dir", "fieldsDirection"],
            ["sel-photo-border", "photoBorder"],
            ["sel-header-style", "headerStyle"],
            ["sel-card-aspect", "aspectMode"],
            ["sel-logo-border", "logoBorderStyle"]
        ];
        selectBindings.forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", () => {
                state[key] = el.value;
                renderCard();
            });
        });

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
            ["rng-logo-contrast", "logoContrast", "val-logo-contrast", (v) => `${v}%`],
            ["rng-logo-saturate", "logoSaturation", "val-logo-saturate", (v) => `${v}%`],
            ["rng-logo-bright", "logoBrightness", "val-logo-bright", (v) => `${v}%`],
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

        document.getElementById("btn-reset-logo-enhance")?.addEventListener("click", () => {
            state.logoContrast = 100;
            state.logoSaturation = 100;
            state.logoBrightness = 100;
            state.logoBorderStyle = "clean";
            state.logoScale = 1.0;
            state.logoOffsetX = 0;
            syncUIFromState();
            renderCard();
            showToast("تم ضبط ألوان وحدود الشعار على الإعداد النقي المحسّن");
        });

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
                syncLogoModePanels();

                if (state.logoMode === "custom" && !images.customLogo) {
                    document.getElementById("inp-logo-file")?.click();
                }
                renderCard();
            });
        });

        bindA4LayoutControls();
    }

    function syncLogoModePanels() {
        const extBox = document.getElementById("extracted-logo-settings");
        const vecBox = document.getElementById("vector-shield-settings");
        const custBox = document.getElementById("custom-logo-settings");
        if (extBox) extBox.style.display = state.logoMode === "extracted" ? "block" : "none";
        if (vecBox) vecBox.style.display = state.logoMode === "vector" ? "block" : "none";
        if (custBox) custBox.style.display = state.logoMode === "custom" ? "block" : "none";
    }

    function bindA4LayoutControls() {
        const presetEl = document.getElementById("sel-a4-preset");
        const colsEl = document.getElementById("inp-a4-cols");
        const rowsEl = document.getElementById("inp-a4-rows");
        const orientEl = document.getElementById("sel-a4-orientation");
        const wMmEl = document.getElementById("inp-card-w-mm");
        const hMmEl = document.getElementById("inp-card-h-mm");
        const gxMmEl = document.getElementById("inp-gap-x-mm");
        const gyMmEl = document.getElementById("inp-gap-y-mm");
        const autoCenterEl = document.getElementById("chk-a4-autocenter");
        const manualMarginsBox = document.getElementById("manual-margins-box");
        const mxMmEl = document.getElementById("inp-margin-x-mm");
        const myMmEl = document.getElementById("inp-margin-y-mm");
        const cropEl = document.getElementById("chk-a4-cropmarks");
        const duplexEl = document.getElementById("chk-a4-duplex-mirror");
        const shiftXEl = document.getElementById("inp-back-shift-x");
        const shiftYEl = document.getElementById("inp-back-shift-y");
        const batchModeEl = document.getElementById("sel-a4-batch-mode");
        const repeatBox = document.getElementById("repeat-count-box");
        const repeatCountEl = document.getElementById("inp-repeat-count");

        const syncA4Inputs = () => {
            if (colsEl) colsEl.value = a4Config.cols;
            if (rowsEl) rowsEl.value = a4Config.rows;
            if (orientEl) orientEl.value = a4Config.orientation;
            if (wMmEl) wMmEl.value = a4Config.cardWidthMm;
            if (hMmEl) hMmEl.value = a4Config.cardHeightMm;
            if (gxMmEl) gxMmEl.value = a4Config.gapXMm;
            if (gyMmEl) gyMmEl.value = a4Config.gapYMm;
            if (autoCenterEl) autoCenterEl.checked = !!a4Config.autoCenter;
            if (manualMarginsBox) manualMarginsBox.style.display = a4Config.autoCenter ? "none" : "grid";
            if (mxMmEl) mxMmEl.value = a4Config.marginXMm;
            if (myMmEl) myMmEl.value = a4Config.marginYMm;
            if (cropEl) cropEl.checked = !!a4Config.cropMarks;
            if (duplexEl) duplexEl.checked = !!a4Config.duplexMirror;
            if (shiftXEl) shiftXEl.value = a4Config.backShiftXMm;
            if (shiftYEl) shiftYEl.value = a4Config.backShiftYMm;
            if (batchModeEl) batchModeEl.value = a4Config.batchMode;
            if (repeatBox) repeatBox.style.display = a4Config.batchMode === "repeat_current" ? "block" : "none";
            if (repeatCountEl) repeatCountEl.value = a4Config.repeatCount;
            updateBatchBadgeCount();
        };

        const ensureLiveA4PreviewOnEdit = () => {
            updateBatchBadgeCount();
            if (state.activeSide !== "a4-front" && state.activeSide !== "a4-back") {
                setStageView("a4-front");
            } else {
                renderCard();
            }
        };

        presetEl?.addEventListener("change", () => {
            const p = presetEl.value;
            a4Config.preset = p;
            if (p === "2x4") {
                Object.assign(a4Config, { cols: 2, rows: 4, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 6.0, gapYMm: 6.0 });
            } else if (p === "2x5") {
                Object.assign(a4Config, { cols: 2, rows: 5, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 48.0, gapXMm: 6.0, gapYMm: 4.5 });
            } else if (p === "2x3") {
                Object.assign(a4Config, { cols: 2, rows: 3, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 8.0, gapYMm: 10.0 });
            } else if (p === "2x2") {
                Object.assign(a4Config, { cols: 2, rows: 2, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 10.0, gapYMm: 12.0 });
            } else if (p === "1x2") {
                Object.assign(a4Config, { cols: 1, rows: 2, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 6.0, gapYMm: 12.0 });
            } else if (p === "1x1") {
                Object.assign(a4Config, { cols: 1, rows: 1, orientation: "portrait", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 0, gapYMm: 0 });
            } else if (p === "3x3") {
                Object.assign(a4Config, { cols: 3, rows: 3, orientation: "landscape", cardWidthMm: 85.6, cardHeightMm: 54.0, gapXMm: 5.0, gapYMm: 6.0 });
            }
            a4Config.repeatCount = a4Config.cols * a4Config.rows;
            syncA4Inputs();
            ensureLiveA4PreviewOnEdit();
        });

        document.getElementById("btn-reset-a4-layout")?.addEventListener("click", () => {
            a4Config = getDefaultA4Config();
            if (presetEl) presetEl.value = "2x4";
            syncA4Inputs();
            ensureLiveA4PreviewOnEdit();
            showToast("تمت استعادة الضبط القياسي لورقة A4 (8 بطاقات)");
        });

        const numericA4Bindings = [
            [colsEl, "cols", 1, 5],
            [rowsEl, "rows", 1, 7],
            [wMmEl, "cardWidthMm", 35, 200],
            [hMmEl, "cardHeightMm", 25, 145],
            [gxMmEl, "gapXMm", 0, 40],
            [gyMmEl, "gapYMm", 0, 40],
            [mxMmEl, "marginXMm", 0, 80],
            [myMmEl, "marginYMm", 0, 80],
            [shiftXEl, "backShiftXMm", -25, 25],
            [shiftYEl, "backShiftYMm", -25, 25],
            [repeatCountEl, "repeatCount", 1, 48]
        ];

        numericA4Bindings.forEach(([el, key, minV, maxV]) => {
            el?.addEventListener("input", () => {
                const raw = parseFloat(el.value);
                if (!Number.isNaN(raw)) {
                    a4Config[key] = Math.max(minV, Math.min(maxV, raw));
                    if (key !== "repeatCount" && key !== "backShiftXMm" && key !== "backShiftYMm" && presetEl) {
                        presetEl.value = "custom";
                    }
                    ensureLiveA4PreviewOnEdit();
                }
            });
        });

        orientEl?.addEventListener("change", () => {
            a4Config.orientation = orientEl.value;
            ensureLiveA4PreviewOnEdit();
        });

        autoCenterEl?.addEventListener("change", () => {
            a4Config.autoCenter = autoCenterEl.checked;
            if (manualMarginsBox) manualMarginsBox.style.display = a4Config.autoCenter ? "none" : "grid";
            ensureLiveA4PreviewOnEdit();
        });

        cropEl?.addEventListener("change", () => {
            a4Config.cropMarks = cropEl.checked;
            ensureLiveA4PreviewOnEdit();
        });

        duplexEl?.addEventListener("change", () => {
            a4Config.duplexMirror = duplexEl.checked;
            ensureLiveA4PreviewOnEdit();
        });

        batchModeEl?.addEventListener("change", () => {
            a4Config.batchMode = batchModeEl.value;
            if (repeatBox) repeatBox.style.display = a4Config.batchMode === "repeat_current" ? "block" : "none";
            ensureLiveA4PreviewOnEdit();
        });

        syncA4Inputs();
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

        // Clear Personal Photo Button (replaces any old reference photo!)
        document.getElementById("btn-photo-default")?.addEventListener("click", () => {
            state.photoMode = "blank";
            state.photoDataUrl = null;
            images.customPhoto = null;
            renderCard();
            showToast("تم مسح الصورة الشخصية وتفريغ مكانها");
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
                        images.dataUrlCache.set(dUrl, sImg);
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

        // Interactive Dragging on Single Card Canvas to reposition Photo
        let isDraggingPhoto = false;
        let dragStartX = 0;
        let dragStartY = 0;

        canvas.addEventListener("mousedown", (e) => {
            if (state.activeSide !== "front" || state.photoMode !== "custom") return;
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
                images.dataUrlCache.set(dataUrl, img);
                state.photoMode = "custom";
                state.photoDataUrl = dataUrl;
                state.photoZoom = 1.0;
                state.photoOffsetX = 0;
                state.photoOffsetY = 0;
                if (state.activeSide === "a4-front" || state.activeSide === "a4-back") {
                    setStageView("front");
                }
                syncUIFromState();
                renderCard();
                showToast("تم إدراج الصورة الشخصية بنجاح");
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
                images.dataUrlCache.set(dataUrl, img);
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
                images.dataUrlCache.set(dataUrl, img);
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
    // EXPORT (PNG / PDF / JSON) & BATCH PRINTING (FRONTS / BACKS / A4)
    // =========================================================================
    function setupExportAndPrint() {
        const saveModal = document.getElementById("save-image-modal");
        const previewImg = document.getElementById("exported-card-preview-img");
        const directAnchor = document.getElementById("direct-download-anchor");
        const pdfModal = document.getElementById("pdf-export-modal");

        const openSaveModal = (dataUrl, fileName) => {
            if (previewImg) previewImg.src = dataUrl;
            if (directAnchor) {
                directAnchor.href = dataUrl;
                directAnchor.download = fileName;
            }
            if (saveModal) saveModal.classList.add("open");
        };

        document.getElementById("btn-close-save-modal")?.addEventListener("click", () => saveModal?.classList.remove("open"));
        document.getElementById("btn-close-save-modal-2")?.addEventListener("click", () => saveModal?.classList.remove("open"));
        document.getElementById("btn-close-pdf-modal")?.addEventListener("click", () => pdfModal?.classList.remove("open"));

        // Download high-res PNG of current single card (blank template or filled employee card)
        document.getElementById("btn-download-png")?.addEventListener("click", () => {
            const sideToRender = state.activeSide === "back" ? "back" : "front";
            const off = renderSingleCardOffscreen(state, sideToRender);
            const cleanName = `${state.nom || "Template_Vierge"}_${state.prenom || ""}_${state.matricule || ""}`.trim().replace(/\s+/g, "_");
            const fileName = `Carte_SSG_${cleanName}.png`;
            const dataUrl = off.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = fileName;
            link.href = dataUrl;
            link.click();
            openSaveModal(dataUrl, fileName);
            showToast("تم تجهيز البطاقة بصيغة PNG فائقة الدقة (2560×1400)");
        });

        // Top Toolbar + Sidebar A4 PDF Export Triggers
        document.getElementById("btn-top-export-pdf")?.addEventListener("click", () => exportBatchA4Pdf("both"));
        document.getElementById("btn-pdf-fronts")?.addEventListener("click", () => exportBatchA4Pdf("fronts"));
        document.getElementById("btn-pdf-backs")?.addEventListener("click", () => exportBatchA4Pdf("backs"));
        document.getElementById("btn-pdf-both")?.addEventListener("click", () => exportBatchA4Pdf("both"));

        // Modal quick re-export buttons
        document.getElementById("btn-modal-pdf-fronts")?.addEventListener("click", () => exportBatchA4Pdf("fronts"));
        document.getElementById("btn-modal-pdf-backs")?.addEventListener("click", () => exportBatchA4Pdf("backs"));
        document.getElementById("btn-modal-pdf-both")?.addEventListener("click", () => exportBatchA4Pdf("both"));

        // Batch Print ALL Fronts at Once & Batch Print ALL Backs at Once
        document.getElementById("btn-top-print-fronts")?.addEventListener("click", () => printBatchA4Sheets("fronts"));
        document.getElementById("btn-batch-print-fronts")?.addEventListener("click", () => printBatchA4Sheets("fronts"));

        document.getElementById("btn-top-print-backs")?.addEventListener("click", () => printBatchA4Sheets("backs"));
        document.getElementById("btn-batch-print-backs")?.addEventListener("click", () => printBatchA4Sheets("backs"));

        // Quick shortcut to A4 Layout & Worker Count Settings tab
        document.getElementById("btn-top-a4-settings")?.addEventListener("click", () => {
            document.getElementById("tab-btn-a4")?.click();
            setStageView("a4-front");
        });

        // Export & Import JSON Project
        document.getElementById("btn-export-json")?.addEventListener("click", () => {
            const payload = { currentCard: state, a4Config: a4Config, workersQueue: cachedSavedCards };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `SSG_Project_${state.nom || "Template"}.json`;
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
                    if (imported && imported.currentCard) {
                        if (imported.a4Config) Object.assign(a4Config, imported.a4Config);
                        applyLoadedCardData(imported.currentCard);
                    } else {
                        applyLoadedCardData(imported);
                    }
                    showToast("تم استيراد بيانات المشروع بنجاح");
                } catch (err) {
                    showToast("ملف JSON غير صالح");
                }
            };
            reader.readAsText(importInput.files[0]);
        });
    }

    // =========================================================================
    // WORKER CARDS QUEUE (Server SQLite + Offline LocalStorage Sync)
    // =========================================================================
    function getLocalQueue() {
        try {
            const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setLocalQueue(list) {
        try {
            localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(list));
        } catch (e) {
            // Ignore quota errors
        }
    }

    async function loadSavedCardsList() {
        const listEl = document.getElementById("saved-cards-list");
        try {
            const res = await fetch("/api/cards");
            const data = await res.json();
            if (data && data.success && Array.isArray(data.cards)) {
                cachedSavedCards = data.cards;
                setLocalQueue(cachedSavedCards);
            }
        } catch (err) {
            cachedSavedCards = getLocalQueue();
        }

        updateBatchBadgeCount();
        if (!listEl) return;

        if (cachedSavedCards.length === 0) {
            listEl.innerHTML = `<p style="font-size:0.78rem; color:var(--text-secondary); padding:0.4rem 0;">
                القائمة فارغة حالياً — سيتم طباعة البطاقة المعروضة حالياً في ورقة A4، أو اضغط <strong>"حفظ وإضافة العامل الحالي للقائمة"</strong> لإضافة عدة عمال مختلفين لطباعتهم معاً.
            </p>`;
            return;
        }

        listEl.innerHTML = "";
        cachedSavedCards.forEach((c, index) => {
            const item = document.createElement("div");
            item.className = "saved-card-item";
            const cd = c.card_data || {};
            const subInfo = [cd.matricule ? `#${cd.matricule}` : "", cd.fonction || "", cd.wilaya || ""].filter(Boolean).join(" • ") || "نموذج فارغ";
            item.innerHTML = `
                <div class="saved-card-info">
                    <h5>${index + 1}. ${escapeHtml(c.title)}</h5>
                    <small>${escapeHtml(subInfo)}</small>
                </div>
                <div style="display:flex; gap:0.3rem;">
                    <button type="button" class="btn btn-outline btn-sm btn-load-card" title="فتح وتعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button type="button" class="btn btn-danger btn-sm btn-del-card" title="حذف من القائمة"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            const openFn = () => {
                applyLoadedCardData({ ...cd, id: c.id });
                setStageView("front");
                showToast(`تم فتح بطاقة: ${c.title}`);
            };
            item.querySelector(".saved-card-info").addEventListener("click", openFn);
            item.querySelector(".btn-load-card").addEventListener("click", openFn);
            item.querySelector(".btn-del-card").addEventListener("click", async () => {
                try {
                    await fetch(`/api/cards/${c.id}`, { method: "DELETE" });
                } catch (e) {
                    cachedSavedCards = cachedSavedCards.filter((itemC) => itemC.id !== c.id);
                    setLocalQueue(cachedSavedCards);
                }
                if (state.id === c.id) state.id = null;
                await loadSavedCardsList();
                renderCard();
                showToast("تم حذف العامل من قائمة الطباعة");
            });
            listEl.appendChild(item);
        });
    }

    async function saveCurrentCardToDB(forceNewEntry = false) {
        const fullName = `${state.nom || ""} ${state.prenom || ""}`.trim();
        const title = fullName
            ? `${fullName}${state.matricule ? ` — ${state.matricule}` : ""}`
            : `بطاقة عامل #${cachedSavedCards.length + 1}`;

        const idToSave = forceNewEntry ? null : (state.id || null);
        const cardSnapshot = JSON.parse(JSON.stringify(state));

        try {
            const res = await fetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: idToSave,
                    title: title,
                    card_data: cardSnapshot
                })
            });
            const data = await res.json();
            if (data && data.success) {
                state.id = data.id;
                await loadSavedCardsList();
                renderCard();
                showToast(`تم حفظ "${title}" في قائمة طباعة A4!`);
                return;
            }
        } catch (err) {
            // Standalone offline storage fallback
        }

        const localId = idToSave || Date.now();
        cardSnapshot.id = localId;
        state.id = localId;
        const idx = cachedSavedCards.findIndex((x) => x.id === localId);
        if (idx >= 0) {
            cachedSavedCards[idx] = { id: localId, title, card_data: cardSnapshot };
        } else {
            cachedSavedCards.push({ id: localId, title, card_data: cardSnapshot });
        }
        setLocalQueue(cachedSavedCards);
        await loadSavedCardsList();
        renderCard();
        showToast(`تم حفظ "${title}" في قائمة طباعة A4!`);
    }

    function applyLoadedCardData(loaded) {
        state = { ...getDefaultState(), ...loaded };
        images.customPhoto = null;
        if (state.photoMode === "custom" && state.photoDataUrl) {
            const img = new Image();
            img.onload = () => {
                images.customPhoto = img;
                images.dataUrlCache.set(state.photoDataUrl, img);
                renderCard();
            };
            img.src = state.photoDataUrl;
        }
        if (state.logoMode === "custom" && state.customLogoDataUrl) {
            const img = new Image();
            img.onload = () => {
                images.customLogo = img;
                images.dataUrlCache.set(state.customLogoDataUrl, img);
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

        setVal("rng-logo-scale", state.logoScale);
        setVal("rng-logo-x", state.logoOffsetX);
        setVal("rng-logo-contrast", state.logoContrast);
        setVal("rng-logo-saturate", state.logoSaturation);
        setVal("rng-logo-bright", state.logoBrightness);
        setVal("sel-logo-border", state.logoBorderStyle);

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };
        setTxt("val-logo-scale", `${Math.round((state.logoScale || 1) * 100)}%`);
        setTxt("val-logo-x", `${state.logoOffsetX || 0}`);
        setTxt("val-logo-contrast", `${state.logoContrast || 100}%`);
        setTxt("val-logo-saturate", `${state.logoSaturation || 100}%`);
        setTxt("val-logo-bright", `${state.logoBrightness || 100}%`);
        setTxt("val-photo-zoom", `${Math.round((state.photoZoom || 1) * 100)}%`);
        setTxt("val-photo-x", `${state.photoOffsetX || 0}`);
        setTxt("val-photo-y", `${state.photoOffsetY || 0}`);
        setTxt("val-photo-bright", `${state.photoBrightness || 100}%`);
        setTxt("val-photo-contrast", `${state.photoContrast || 100}%`);

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

        document.querySelectorAll(".mode-pill[data-logo-mode]").forEach((b) => {
            b.classList.toggle("active", b.getAttribute("data-logo-mode") === state.logoMode);
        });
        syncLogoModePanels();
    }

    function setStageView(viewMode) {
        state.activeSide = viewMode;
        const map = {
            "front": "btn-view-front",
            "back": "btn-view-back",
            "a4-front": "btn-view-a4-front",
            "a4-back": "btn-view-a4-back"
        };
        Object.values(map).forEach((btnId) => {
            document.getElementById(btnId)?.classList.remove("active");
        });
        document.getElementById(map[viewMode] || "btn-view-front")?.classList.add("active");
        renderCard();
    }

    // =========================================================================
    // TABS, VIEW SWITCHER & QUICK WORKFLOW ACTIONS
    // =========================================================================
    function setupNavigation() {
        document.querySelectorAll(".tab-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
                document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
                btn.classList.add("active");
                const target = document.getElementById(btn.getAttribute("data-tab"));
                if (target) target.classList.add("active");
            });
        });

        // 4 Stage View Modes: Single Front | Single Back | A4 Sheet Fronts | A4 Sheet Backs
        document.getElementById("btn-view-front")?.addEventListener("click", () => setStageView("front"));
        document.getElementById("btn-view-back")?.addEventListener("click", () => setStageView("back"));
        document.getElementById("btn-view-a4-front")?.addEventListener("click", () => setStageView("a4-front"));
        document.getElementById("btn-view-a4-back")?.addEventListener("click", () => setStageView("a4-back"));

        const refBox = document.getElementById("reference-compare-box");
        document.getElementById("btn-toggle-reference")?.addEventListener("click", () => {
            refBox?.classList.toggle("visible");
        });
        document.getElementById("btn-close-reference")?.addEventListener("click", () => {
            refBox?.classList.remove("visible");
        });

        // Save / Add Worker to A4 Queue buttons
        document.getElementById("btn-save-card-db")?.addEventListener("click", () => saveCurrentCardToDB(false));
        document.getElementById("btn-add-current-to-queue")?.addEventListener("click", () => saveCurrentCardToDB(true));

        // Quick Toolbar Upload Buttons
        document.getElementById("btn-quick-upload-logo")?.addEventListener("click", () => {
            document.getElementById("inp-logo-file")?.click();
        });
        document.getElementById("btn-quick-upload-photo")?.addEventListener("click", () => {
            document.getElementById("inp-photo-file")?.click();
        });

        // Company Presets
        document.getElementById("btn-preset-ssg")?.addEventListener("click", () => {
            state.companyName = "S.S.G LILHIRASSA WA ELAMEN";
            state.companyFontSize = 54;
            state.logoMode = "extracted";
            state.stampTopText = "S.S.G LILHIRASSA WA ELAMEN";
            state.stampBottomText = "GARDIENNAGE & SÉCURITÉ";
            syncUIFromState();
            renderCard();
            showToast("تم تطبيق نموذج وشعار شركة S.S.G LILHIRASSA WA ELAMEN المحسّن");
        });

        document.getElementById("btn-preset-alamine")?.addEventListener("click", () => {
            state.companyName = "SARL AL-AMINE GARD";
            state.companyFontSize = 64;
            state.logoMode = "vector";
            state.shieldArabic = "الأمين";
            state.shieldLine1 = "AL-AMINE";
            state.shieldLine2 = "GARD";
            state.shieldPrimaryColor = "#24333f";
            state.shieldAccentColor = "#59a1be";
            state.shieldInnerBg = "#c8e3ed";
            state.stampTopText = "SARL AL-AMINE GARD";
            syncUIFromState();
            renderCard();
            showToast("تم التبديل إلى قالب SARL AL-AMINE GARD");
        });

        // Drag-and-Drop directly onto Canvas (Left 38% = Logo, Right 62% = Personal Photo)
        canvas.addEventListener("dragover", (e) => e.preventDefault());
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

        // Enter New Blank Worker Card (clearing all personal fields & personal photo cleanly)
        document.getElementById("btn-new-blank-card")?.addEventListener("click", () => {
            state.id = null;
            state.nom = "";
            state.prenom = "";
            state.matricule = "";
            state.groupeSanguin = "";
            state.fonction = "";
            state.dateExpiration = "";
            state.wilaya = "";
            state.extraFields = [];
            state.photoMode = "blank";
            state.photoDataUrl = null;
            images.customPhoto = null;
            setStageView("front");
            syncUIFromState();
            renderExtraFieldsUI();
            document.querySelector('.tab-btn[data-tab="tab-employee"]')?.click();
            document.getElementById("inp-nom")?.focus();
            showToast("تم تفريغ الحقول والصورة — جاهز لإدخال عامل جديد");
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
        }, 3000);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // Initialize Studio
    bindInputsToState();
    setupFileUploads();
    setupWebcam();
    setupExportAndPrint();
    setupNavigation();
    syncUIFromState();
    loadSavedCardsList();
    renderCard();
})();
