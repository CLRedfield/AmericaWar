const WestRussiaFocusLayout = (() => {
    const cardWidth = 180;
    const cardHeight = 106;
    const cellWidth = 216;
    const cellHeight = 142;
    const padding = 22;
    const headingHeight = 34;
    const chapterGap = 52;

    // Each row is a tier. A nested list stacks related chapters in the same wing.
    // Keys are the first focus of each chapter, independent of its display name.
    const boards = {
        // The marshal and his successor share a flank, beside two other fronts.
        WRF: [
            ['dockSounding', 'report', 'staffMap'],
            [
                ['cadres_commit', 'schoolRoster'], ['zhukov_commit', 'shelterMap'],
                ['continuity_commit', 'dualSignatures'], 'tukhachevsky_commit'
            ],
            ['ukhtaWells', 'railInventory', 'westernFiles', 'southRailOrder']
        ],
        // The election fans out into three caucuses. Science grows out of the left wing.
        KOM: [
            ['report'],
            ['ferryPiers', 'rollBook', 'lostRegistry'],
            [
                ['research_commit', 'generators'], ['left_commit', 'shopDelegates'],
                ['centre_commit', 'secondSession'], ['right_commit', 'guardRoll']
            ],
            ['timberStock', 'countyEnvoys']
        ],
        // The crown sits above four camps, with the court and the arsenals below.
        VYA: [
            ['report', 'royalAssets'],
            ['kadets_commit', 'shulgin_commit', 'solidarists_commit', 'rovs_commit'],
            [['ruralCircle', 'localRegisters'], ['borderPasses', 'crownRoads'], ['cadetInspection', 'izhevskLathes']],
            ['oreFloors', 'eastRailSurvey', 'izhevskCorridor']
        ],
        // Civil authority, the officer corps and contractors form separate pillars.
        SAM: [
            ['pressCredentials', 'report', 'ledgerClerks'],
            [
                ['zykov_commit', 'localPublicOffice', 'familyInquiries'], ['officers_commit', 'officerTraining'],
                ['steel_commit', 'engineWorks'], ['oktan_commit', 'refineryAudit']
            ],
            ['receivingStations', 'ferryChains', 'crossingOffensive']
        ],
        // Two sides of the Perm crisis, with the Kama reconstruction below them.
        PRM: [
            ['report', 'guardInspectors'],
            [
                ['vagner_commit', 'velimir_commit'], ['armsCounting', 'engineerRegister', 'restoreIdentity', 'riverSafety'],
                ['workers_commit', 'mutualAid'], ['engineers_commit', 'shopsSurvey']
            ],
            ['saltStock', 'depotInventory', 'upperKamaAgency']
        ],
        // The coast opens into a defensive fan from the Finnish supply line.
        ONE: [
            ['report'],
            ['iceChart', 'aidManifest', 'dryDocks'],
            [
                ['patrol_commit', 'beachScouts'], ['treaty_commit', 'inspectWinterStores'],
                ['autonomy_commit', 'lakeTownCouncil'], ['harbor_commit', 'lakeMaps']
            ],
            ['woodsleds', 'saltAndRye', 'admitBorderTowns', 'coastalDirective']
        ],
        // The factory and armor column is flanked by worker and river administrations.
        GOR: [
            ['report', 'powerCycle', 'serviceableHull'],
            [
                ['workers_commit', 'factoryDelegates', 'machinistApprentices'], ['armor_commit', 'rifleInventory', 'factoryOffensiveOrder'],
                ['river_commit', 'crossingMap', 'forestRoads'], ['veterans_commit', 'pensionBook', 'acquireSparePlants']
            ]
        ],
        // A civil corridor and an armed corridor lead to the rescue operation.
        VOL: [
            ['workshopFurnaces', 'report', 'borderLedger'],
            [
                ['schools_commit', 'reopenClassrooms'], ['municipal_commit', 'countyMeetings'],
                ['shelterRegisters', 'neighborEmergencyFiles'], ['neutrality_commit', 'stationMilitia', 'sidingsAtVologda'],
                ['coops_commit', 'seedWarehouse']
            ],
            ['emergencyTrainLabel']
        ],
        // Parish and guard networks meet at the upper Kama crossing.
        GEO: [
            ['parishLedgers', 'report', 'bridgeOath'],
            [
                ['law_commit', 'civilJudge'], ['parishes_commit', 'villageSeedLoans', 'warningBells'],
                ['landingFees', 'countSupplyLoads'], 'order_commit', ['forestry_commit', 'timberSurvey']
            ],
            ['landAdmission', 'riverRecoveryOrder']
        ],
        // The river is the central axis between the two political banks.
        TAT: [
            ['translationDesk', 'report', 'ferryWatch'],
            [
                ['federation_commit', 'townAccords'], 'assembly_commit',
                ['riverBook', 'loadingUnion', 'newRiverTowns', 'regionalEnergyReport'],
                'guard_commit', ['union_commit', 'zelenodolskYards']
            ],
            ['forestSurveyors', 'nurlatWells']
        ],
        // The mountain defense forms a spine, with farms and oil on its flanks.
        BSH: [
            ['districtRequests', 'report', 'ridgeGuides', 'oilLedgers'],
            [
                ['farm_commit', 'farmDelegates'], 'home_commit', ['mountains_commit', 'reserveRolls', 'shelterDepots', 'outwardRidgePlan'],
                ['oil_commit', 'ironOreSurvey', 'marketCrossingHours']
            ],
            ['riverCrossings', 'handoverCouriers']
        ]
    };

    function placeChapter(nodes, parents) {
        const byId = new Map(nodes.map(focus => [focus.id, focus]));
        const previous = new Map(nodes.map(focus => [focus.id, parents.get(focus.id).filter(id => byId.has(id))]));
        const next = new Map(nodes.map(focus => [focus.id, []]));
        for (const [id, ids] of previous) ids.forEach(parentId => next.get(parentId).push(id));

        // The gameplay rank gives a topological order. Only local edges set display rows.
        const ordered = [...nodes].sort((a, b) => a.y - b.y);
        let rows = new Map();
        for (const { id } of ordered) rows.set(id, Math.max(0, ...previous.get(id).map(parentId => rows.get(parentId) + 1)));

        // Give uninterrupted runs one column. Turns happen at forks and joins.
        const runs = [];
        const runById = new Map();
        for (const focus of ordered) {
            if (runById.has(focus.id)) continue;
            const run = [focus];
            let tail = focus.id;
            while (next.get(tail).length === 1 && previous.get(next.get(tail)[0]).length === 1) {
                tail = next.get(tail)[0];
                run.push(byId.get(tail));
            }
            run.forEach(node => runById.set(node.id, run));
            runs.push(run);
        }

        // Bring uneven feeders closer to a merge without lengthening the critical path.
        const lastRow = Math.max(...rows.values());
        const edges = [...previous].flatMap(([id, ids]) => ids.map(parentId => [parentId, id]));
        const compact = new Map(rows);
        let moved;
        let fits = true;
        do {
            moved = false;
            for (const [parentId, id] of edges) {
                const gap = compact.get(id) - compact.get(parentId);
                if (gap >= 1 && gap <= 2) continue;
                const run = runById.get(gap > 2 ? parentId : id);
                const shift = gap > 2 ? gap - 2 : 1 - gap;
                if (compact.get(run.at(-1).id) + shift > lastRow) {
                    fits = false;
                    break;
                }
                run.forEach(node => compact.set(node.id, compact.get(node.id) + shift));
                moved = true;
            }
        } while (fits && moved);
        if (fits) rows = compact;

        // A feeder with no local parent can sit right above the project it joins.
        for (const run of [...runs].reverse()) {
            const first = run[0].id;
            const last = run[run.length - 1].id;
            const successors = next.get(last);
            if (previous.get(first).length || !successors.length) continue;
            const shift = Math.min(...successors.map(id => rows.get(id))) - rows.get(last) - 1;
            run.forEach(({ id }) => rows.set(id, rows.get(id) + shift));
        }

        const occupied = new Set();
        const columns = new Map();
        for (const run of runs) {
            const lanes = run.map(node => node.x).sort((a, b) => a - b);
            const preferred = lanes[Math.floor(lanes.length / 2)];
            const free = column => run.every(({ id }) => !occupied.has(column + ',' + rows.get(id)));
            let column = preferred;
            for (let distance = 1; !free(column); distance++) {
                column = free(preferred - distance) ? preferred - distance : preferred + distance;
            }
            for (const { id } of run) {
                columns.set(id, column);
                occupied.add(column + ',' + rows.get(id));
            }
        }

        const lanes = [...new Set(columns.values())].sort((a, b) => a - b);
        const laneIndex = new Map(lanes.map((lane, index) => [lane, index]));
        const firstRow = Math.min(...rows.values());
        const positions = nodes.map(({ id }) => ({
            id, column: laneIndex.get(columns.get(id)), row: rows.get(id) - firstRow
        }));
        return {
            name: nodes[0].branch,
            category: nodes[0].category,
            entryId: nodes[0].id,
            positions,
            width: padding * 2 + (lanes.length - 1) * cellWidth + cardWidth,
            height: padding * 2 + headingHeight + (Math.max(...rows.values()) - firstRow) * cellHeight + cardHeight
        };
    }

    function build(tree, factionId, onlyBranch) {
        const byId = new Map(tree.map(focus => [focus.id, focus]));
        const parents = new Map();
        const references = new Map();
        const branches = new Map();
        for (const focus of tree) {
            const ids = [...new Set([...focus.prerequisites, ...(focus.prerequisiteAny || []).flat()])];
            parents.set(focus.id, ids);
            references.set(focus.id, {
                before: ids.filter(id => byId.get(id).branch !== focus.branch),
                after: [],
                exclusive: focus.mutuallyExclusive || []
            });
            if (!branches.has(focus.branch)) branches.set(focus.branch, []);
            branches.get(focus.branch).push(focus);
        }
        for (const [id, { before }] of references) before.forEach(parentId => references.get(parentId).after.push(id));

        const chapters = new Map();
        const prefix = `wr_${factionId.toLowerCase()}_`;
        for (const [branch, nodes] of branches) {
            if (onlyBranch && onlyBranch !== branch) continue;
            const chapter = placeChapter(nodes, parents);
            chapters.set(chapter.entryId.slice(prefix.length), chapter);
        }
        const planned = onlyBranch ? [] : boards[factionId];
        const mappedKeys = new Set(planned.flat(2));
        const extra = [...chapters.keys()].filter(key => !mappedKeys.has(key));
        const tiers = [...planned, ...extra.map(key => [key])].map(tier => {
            const stacks = tier.map(keys => [].concat(keys).map(key => chapters.get(key)).filter(Boolean)).filter(stack => stack.length)
                .map(sections => ({
                    sections,
                    width: Math.max(...sections.map(chapter => chapter.width)),
                    height: sections.reduce((height, chapter) => height + chapter.height, 0) + (sections.length - 1) * chapterGap
                }));
            return {
                stacks,
                width: stacks.reduce((width, stack) => width + stack.width, 0) + (stacks.length - 1) * chapterGap,
                height: Math.max(...stacks.map(stack => stack.height), 0)
            };
        });
        const width = Math.max(...tiers.map(tier => tier.width), 0) + padding * 2;
        const positions = {};
        const sections = [];
        let top = padding;
        for (const tier of tiers) {
            let left = (width - tier.width) / 2;
            for (const stack of tier.stacks) {
                let y = top;
                for (const chapter of stack.sections) {
                    const x = left + (stack.width - chapter.width) / 2;
                    sections.push({ ...chapter, left: x, top: y });
                    for (const { id, column, row } of chapter.positions) {
                        const cardLeft = x + padding + column * cellWidth;
                        const cardTop = y + padding + headingHeight + row * cellHeight;
                        positions[id] = { left: cardLeft, top: cardTop, topY: cardTop, bottomY: cardTop + cardHeight,
                            centerX: cardLeft + cardWidth / 2, centerY: cardTop + cardHeight / 2, row, column };
                    }
                    y += chapter.height + chapterGap;
                }
                left += stack.width + chapterGap;
            }
            top += tier.height + chapterGap;
        }

        return { positions, sections, references, width, height: top - chapterGap + padding, cardWidth, cardHeight, cellWidth, cellHeight };
    }

    return { build };
})();
