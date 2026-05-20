function startApplication() {
    const adapterPanel = document.getElementById('adapter-panel');
    const dropOutputPanel = document.getElementById('drop-output-panel');
    const resetBtn = document.getElementById('reset-btn');
    const checkBtn = document.getElementById('check-btn');
    const statusBoard = document.getElementById('status-board');
    const statusList = document.getElementById('status-list');
    const typeRadios = document.querySelectorAll('input[name="cto-type"]');
    const svgCanvas = document.getElementById('fiber-svg-canvas');

    if (!adapterPanel || !dropOutputPanel) return;

    let currentMode = 'meio'; 
    let selectedConnector = null;

    const CONFIG = {
        total: {
            ports: [
                { id: 'P1', label: '1' }, { id: 'P2', label: '2' }, 
                { id: 'P3', label: '3' }, { id: 'P4', label: '4' }, 
                { id: 'P5', label: '5' }, { id: 'P6', label: '6' }, 
                { id: 'P7', label: '7' }, { id: 'P8', label: '8' }
            ],
            outputs: [
                { displayLabel: '1', expected: ['P1', null] },
                { displayLabel: '2', expected: ['P2', null] },
                { displayLabel: '3', expected: ['P3', null] },
                { displayLabel: '4', expected: ['P4', null] },
                { displayLabel: '5', expected: ['P5', null] },
                { displayLabel: '6', expected: ['P6', null] },
                { displayLabel: '7', expected: ['P7', null] },
                { displayLabel: '8', expected: ['P8', null] }
            ]
        },
        meio: {
            portsRowA: [
                { id: 'P5A', label: '5A' }, { id: 'P6A', label: '6A' }, 
                { id: 'P7A', label: '7A' }, { id: 'P8A', label: '8A' },
                { id: 'P1A', label: '1A' }, { id: 'P2A', label: '2A' }, 
                { id: 'P3A', label: '3A' }, { id: 'P4A', label: '4A' }
            ],
            portsRowB: [
                { id: 'P1B', label: '1B' }, { id: 'P2B', label: '2B' }, 
                { id: 'P3B', label: '3B' }, { id: 'P4B', label: '4B' },
                { id: 'P5B', label: '5B' }, { id: 'P6B', label: '6B' }, 
                { id: 'P7B', label: '7B' }, { id: 'P8B', label: '8B' }
            ],
            // Ajuste estrito do cruzamento: Saída 1 espera entrada 5 e ramal 1, etc.
            outputs: [
                { displayLabel: '5C', expected: ['P1A', 'P5B'] },
                { displayLabel: '6C', expected: ['P2A', 'P6B'] },
                { displayLabel: '7C', expected: ['P3A', 'P7B'] },
                { displayLabel: '8C', expected: ['P4A', 'P8B'] },
                { displayLabel: '1C', expected: ['P5A', 'P1B'] },
                { displayLabel: '2C', expected: ['P6A', 'P2B'] },
                { displayLabel: '3C', expected: ['P7A', 'P3B'] },
                { displayLabel: '4C', expected: ['P8A', 'P4B'] }
            ]
        }
    };

    function init() {
        injectSignatureStyles();
        renderCTO();
        injectFooterSignature();
        setupDragAndDrop();
        setupClickSelection();
        
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => {
                drawFiberLines();
            });
            const ctoCase = document.querySelector('.cto-case');
            if (ctoCase) resizeObserver.observe(ctoCase);
        }
    }

    function injectSignatureStyles() {
        if (document.getElementById('signature-dynamic-css')) return;
        const style = document.createElement('style');
        style.id = 'signature-dynamic-css';
        style.innerHTML = `
            .app-signature-footer {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin-top: 40px;
                padding: 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
                background-color: transparent;
                width: 100%;
                box-sizing: border-box;
            }
            .app-signature-avatar {
                border-radius: 50%;
                border: 2px solid var(--fiber-line, #4caf50);
                object-fit: cover;
                margin-bottom: 8px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .app-signature-text {
                font-family: sans-serif;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                font-weight: 500;
                letter-spacing: 0.5px;
            }
            @media (orientation: portrait) {
                .app-signature-avatar {
                    width: 25vw;
                    height: 25vw;
                }
            }
            @media (orientation: landscape) {
                .app-signature-avatar {
                    width: 25vh;
                    height: 25vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function injectFooterSignature() {
        if (document.getElementById('creator-signature-block')) return;
        
        const mainContainer = document.querySelector('main') || document.body;
        const footer = document.createElement('div');
        footer.id = 'creator-signature-block';
        footer.classList.add('app-signature-footer');

        const avatar = document.createElement('img');
        avatar.classList.add('app-signature-avatar');
        avatar.src = 'https://avatars.githubusercontent.com/u/42700733?v=4';
        avatar.alt = 'Victor Fernando';

        const text = document.createElement('span');
        text.classList.add('app-signature-text');
        text.innerText = 'feito por Victor Fernando';

        footer.appendChild(avatar);
        footer.appendChild(text);
        mainContainer.appendChild(footer);
    }

    function renderCTO() {
        adapterPanel.innerHTML = '';
        dropOutputPanel.innerHTML = '';
        if (svgCanvas) svgCanvas.innerHTML = '';
        if (statusBoard) statusBoard.classList.add('hidden');
        selectedConnector = null;

        if (currentMode === 'total') {
            const rowElement = document.createElement('div');
            rowElement.classList.add('adapter-row');
            CONFIG.total.ports.forEach(port => {
                rowElement.appendChild(createAdapterSlot(port));
            });
            adapterPanel.appendChild(rowElement);

            CONFIG.total.outputs.forEach((output, index) => {
                dropOutputPanel.appendChild(createPairBlock(`Saída ${output.displayLabel}`, index));
            });
        } else {
            const rowA = document.createElement('div');
            rowA.classList.add('adapter-row');
            CONFIG.meio.portsRowA.forEach(port => {
                rowA.appendChild(createAdapterSlot(port));
            });

            const rowB = document.createElement('div');
            rowB.classList.add('adapter-row');
            CONFIG.meio.portsRowB.forEach(port => {
                rowB.appendChild(createAdapterSlot(port));
            });

            adapterPanel.appendChild(rowA);
            adapterPanel.appendChild(rowB);

            CONFIG.meio.outputs.forEach((output, index) => {
                dropOutputPanel.appendChild(createPairBlock(`${output.displayLabel}`, index));
            });
        }

        setTimeout(drawFiberLines, 60);
    }

    function createAdapterSlot(port) {
        const slot = document.createElement('div');
        slot.classList.add('slot-adapter');
        slot.setAttribute('data-origin-id', port.id);

        const label = document.createElement('span');
        label.classList.add('slot-label');
        label.innerText = port.label;
        slot.appendChild(label);

        const connector = document.createElement('div');
        connector.classList.add('connector-optical');
        connector.setAttribute('draggable', 'true');
        connector.setAttribute('id', `conn-${port.id}`);
        connector.setAttribute('data-source-port', port.id);

        slot.appendChild(connector);
        return slot;
    }

    function createPairBlock(labelText, index) {
        const pairBlock = document.createElement('div');
        pairBlock.classList.add('pair-block');

        const title = document.createElement('div');
        title.classList.add('pair-title');
        title.innerText = labelText;
        pairBlock.appendChild(title);

        const slotsContainer = document.createElement('div');
        slotsContainer.classList.add('pair-slots');

        for (let sub = 0; sub < 2; sub++) {
            const targetSlot = document.createElement('div');
            targetSlot.classList.add('drop-target-slot');
            targetSlot.setAttribute('data-pair-index', index);
            targetSlot.setAttribute('data-sub-slot', sub);
            slotsContainer.appendChild(targetSlot);
        }

        pairBlock.appendChild(slotsContainer);
        return pairBlock;
    }

    function drawFiberLines() {
        if (!svgCanvas) return;
        svgCanvas.innerHTML = '';
        const caseElement = document.querySelector('.cto-case');
        if (!caseElement) return;
        const caseRect = caseElement.getBoundingClientRect();
        const connectors = document.querySelectorAll('.connector-optical');

        connectors.forEach(conn => {
            const parentSlot = conn.parentElement;
            if (parentSlot && parentSlot.classList.contains('drop-target-slot')) {
                const sourcePortId = conn.getAttribute('data-source-port');
                const originalAdapter = document.querySelector(`.slot-adapter[data-origin-id="${sourcePortId}"]`);
                
                if (originalAdapter) {
                    const origRect = originalAdapter.getBoundingClientRect();
                    const targetRect = parentSlot.getBoundingClientRect();

                    const x1 = (origRect.left + origRect.width / 2) - caseRect.left;
                    const y1 = (origRect.bottom) - caseRect.top;
                    const x2 = (targetRect.left + targetRect.width / 2) - caseRect.left;
                    const y2 = (targetRect.top) - caseRect.top;

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const cpY1 = y1 + 35;
                    const cpY2 = y2 - 35;
                    const d = `M ${x1} ${y1} C ${x1} ${cpY1}, ${x2} ${cpY2}, ${x2} ${y2}`;

                    path.setAttribute('d', d);
                    path.setAttribute('stroke', 'var(--fiber-line)');
                    path.setAttribute('stroke-width', '1.5');
                    path.setAttribute('fill', 'none');
                    path.setAttribute('opacity', '0.75');
                    svgCanvas.appendChild(path);
                }
            }
        });
    }

    function setupClickSelection() {
        document.addEventListener('click', (e) => {
            const clickedConnector = e.target.closest('.connector-optical');
            const clickedTargetSlot = e.target.closest('.drop-target-slot') || e.target.closest('.slot-adapter');

            if (clickedConnector) {
                e.stopPropagation();
                if (selectedConnector === clickedConnector) {
                    selectedConnector.classList.remove('selected');
                    selectedConnector = null;
                } else {
                    if (selectedConnector) selectedConnector.classList.remove('selected');
                    selectedConnector = clickedConnector;
                    selectedConnector.classList.add('selected');
                }
                return;
            }

            if (selectedConnector && clickedTargetSlot && !clickedTargetSlot.hasChildNodes()) {
                clickedTargetSlot.appendChild(selectedConnector);
                selectedConnector.classList.remove('selected');
                selectedConnector = null;
                
                const oldMark = clickedTargetSlot.querySelector('.slot-validation-mark');
                if (oldMark) oldMark.remove();
                
                drawFiberLines();
                return;
            }
        });
    }

    function setupDragAndDrop() {
        let draggedElement = null;

        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('connector-optical')) {
                draggedElement = e.target;
                e.dataTransfer.setData('text/plain', e.target.id);
                e.target.style.opacity = '0.5';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('connector-optical')) {
                e.target.style.opacity = '1';
                draggedElement = null;
            }
        });

        document.addEventListener('dragover', (e) => {
            const slot = e.target.closest('.drop-target-slot') || e.target.closest('.slot-adapter');
            if (slot && !slot.hasChildNodes()) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.drop-target-slot') || e.target.closest('.slot-adapter');
            if (slot && !slot.hasChildNodes() && draggedElement) {
                slot.appendChild(draggedElement);
                drawFiberLines();
            }
        });
    }

    function checkConfiguration() {
        const currentConfig = CONFIG[currentMode];
        if (!statusList || !statusBoard) return;
        statusList.innerHTML = '';

        document.querySelectorAll('.slot-validation-mark').forEach(m => m.remove());

        currentConfig.outputs.forEach((output, index) => {
            const slots = document.querySelectorAll(`.drop-target-slot[data-pair-index="${index}"]`);
            const currentConnected = [];

            slots.forEach(slot => {
                const connector = slot.querySelector('.connector-optical');
                if (connector) {
                    currentConnected.push(connector.getAttribute('data-source-port'));
                }
            });

            const req1 = output.expected[0];
            const req2 = output.expected[1];
            
            let pairMatch = false;
            if (req2 === null) {
                pairMatch = currentConnected.includes(req1);
            } else {
                pairMatch = currentConnected.includes(req1) && currentConnected.includes(req2) && currentConnected.length === 2;
            }

            slots.forEach(slot => {
                const connector = slot.querySelector('.connector-optical');
                if (connector) {
                    const mark = document.createElement('span');
                    mark.classList.add('slot-validation-mark');
                    mark.innerText = pairMatch ? '✓' : '✗';
                    mark.style.color = pairMatch ? 'var(--success)' : 'var(--danger)';
                    slot.appendChild(mark);
                }
            });

            const logItem = document.createElement('div');
            logItem.classList.add('status-item');
            logItem.style.color = pairMatch ? 'var(--success)' : 'var(--danger)';
            logItem.innerText = `Saída ${output.displayLabel}: ${pairMatch ? '✓ OK' : '✗ Falha'}`;
            statusList.appendChild(logItem);
        });

        statusBoard.classList.remove('hidden');
    }

    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            renderCTO();
        });
    });

    if (resetBtn) resetBtn.addEventListener('click', renderCTO);
    if (checkBtn) checkBtn.addEventListener('click', checkConfiguration);

    init();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApplication);
    } else {
        startApplication();
    }
}
