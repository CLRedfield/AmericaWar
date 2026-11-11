const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Representative legal closures include their shared epilogues. Each check uses
// live App.applyFocusEffect and effective player getters, including the final
// ideology replacement and cost/maintenance floors.
const routes = [
    {"factionId":"USA","id":"usa_army_state","pathIds":["usa_secure_command","usa_emergency_war_powers","usa_union_path","usa_american_caesar","usa_government_by_decree","usa_military_censors","usa_military_board","usa_war_directorate","usa_army_state","usa_caesar_state","usa_victory_in_the_civil_war","usa_begin_reconstruction","usa_union_forever"],"ideology":"military_junta","expected":{"moneyIncome":2,"ppIncome":2,"maintenanceRate":-0.01,"freeTroops":6,"recruitAmount":1,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0.3,"globalDefense":0.05,"ppCapBonus":8,"actionCost:move":-1,"actionCost:build":-1}},
    {"factionId":"CSA","id":"CSA_american_red_army","pathIds":["CSA_emergency_council","CSA_general_staff","CSA_butler_command","CSA_red_marines","CSA_amphibious_assault","CSA_marine_command","CSA_american_red_army","CSA_red_officer_schools"],"ideology":"military_junta","expected":{"moneyIncome":0,"ppIncome":1,"maintenanceRate":0.02,"freeTroops":8,"recruitAmount":0,"recruitCost":-1,"captureMoney":0,"captureTroops":0,"globalAttack":0.35,"globalDefense":0,"ppCapBonus":0,"actionCost:move":-1,"actionCost:build":0}},
    {"factionId":"AUS","id":"AUS_esoteric_order","pathIds":["AUS_emergency_cabinet","AUS_baton_rouge_pact","AUS_silver_legion","AUS_silver_shirts","AUS_klan_revival","AUS_radio_priest_pulpit","AUS_soulcraft_circles","AUS_blood_and_soil","AUS_soulcraft_doctrine","AUS_pyramid_mysteries","AUS_galahad_colleges","AUS_esoteric_order"],"ideology":"esoteric_fascism","expected":{"moneyIncome":1,"ppIncome":2,"maintenanceRate":-0.03,"freeTroops":15,"recruitAmount":2,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0.2,"globalDefense":0.08,"ppCapBonus":-23,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"CON","id":"CON_ci_dominion","pathIds":["CON_emergency_regency","CON_constitutional_convention","CON_car_path","CON_all_democratic_party","CON_southern_manifesto","CON_strongman_call","CON_christian_identity","CON_ci_white_gospel","CON_ci_dominion","CON_constitutional_republic","CON_southern_destiny"],"ideology":"christian_identity","expected":{"moneyIncome":2.5,"ppIncome":3.5,"maintenanceRate":-0.04,"freeTroops":8,"recruitAmount":0,"recruitCost":-1,"captureMoney":0,"captureTroops":0,"globalAttack":-0.05,"globalDefense":0.23,"ppCapBonus":5,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"CON","id":"CON_patton_caudillo","pathIds":["CON_emergency_regency","CON_constitutional_convention","CON_car_path","CON_all_democratic_party","CON_southern_manifesto","CON_strongman_call","CON_patton_junta","CON_patton_martial_law","CON_patton_caudillo","CON_constitutional_republic","CON_southern_destiny"],"ideology":"military_junta","expected":{"moneyIncome":0,"ppIncome":1,"maintenanceRate":-0.04,"freeTroops":4,"recruitAmount":0,"recruitCost":0,"captureMoney":0,"captureTroops":1,"globalAttack":0.2,"globalDefense":0.08,"ppCapBonus":5,"actionCost:move":-1,"actionCost:build":0}},
    {"factionId":"CON","id":"CON_unia_liberia_pact","pathIds":["CON_emergency_regency","CON_constitutional_convention","CON_black_revolt","CON_black_draft","CON_uplift_movement","CON_garvey_unia","CON_unia_black_star","CON_unia_back_to_africa","CON_unia_liberia_pact"],"ideology":"garveyism","expected":{"moneyIncome":5,"ppIncome":0,"maintenanceRate":-0.02,"freeTroops":2,"recruitAmount":2,"recruitCost":-1,"captureMoney":3,"captureTroops":0,"globalAttack":0,"globalDefense":0,"ppCapBonus":-6,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"CON","id":"CON_noi_nation_state","pathIds":["CON_emergency_regency","CON_constitutional_convention","CON_black_revolt","CON_black_draft","CON_uplift_movement","CON_noi_nation","CON_noi_self_reliance","CON_noi_fruit","CON_noi_nation_state"],"ideology":"black_nationalism","expected":{"moneyIncome":3,"ppIncome":1,"maintenanceRate":-0.04,"freeTroops":10,"recruitAmount":4,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0.05,"globalDefense":0.05,"ppCapBonus":4,"actionCost:move":0,"actionCost:build":-1}},
    {"factionId":"NEN","id":"NEN_quaker_commonwealth","pathIds":["NEN_defense_council","NEN_compact_convention","NEN_liberal_path","NEN_town_meetings","NEN_civic_militia","NEN_civil_liberties","NEN_quaker_pacifism","NEN_peace_testimony","NEN_quaker_commonwealth","NEN_free_commonwealth","NEN_commonwealth_mandate"],"ideology":"quaker_commonwealth","expected":{"moneyIncome":2,"ppIncome":4,"maintenanceRate":-0.07,"freeTroops":10,"recruitAmount":1,"recruitCost":-1,"captureMoney":0,"captureTroops":0,"globalAttack":-0.05,"globalDefense":0.18,"ppCapBonus":37,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"NEN","id":"NEN_shielded_commonwealth","pathIds":["NEN_defense_council","NEN_compact_convention","NEN_protectorate_path","NEN_foreign_liaison","NEN_dominion_charter","NEN_canadian_protectorate","NEN_import_controls","NEN_shielded_commonwealth","NEN_protected_realm","NEN_commonwealth_mandate"],"ideology":"security_state","expected":{"moneyIncome":3,"ppIncome":2,"maintenanceRate":-0.05,"freeTroops":8,"recruitAmount":0,"recruitCost":-1,"captureMoney":0,"captureTroops":0,"globalAttack":-0.05,"globalDefense":0.2,"ppCapBonus":2,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"NEN","id":"NEN_new_england_crown","pathIds":["NEN_defense_council","NEN_compact_convention","NEN_protectorate_path","NEN_foreign_liaison","NEN_dominion_charter","NEN_restored_monarchy","NEN_crown_council","NEN_new_england_crown","NEN_protected_realm","NEN_commonwealth_mandate"],"ideology":"new_england_monarchy","expected":{"moneyIncome":2,"ppIncome":3.0,"maintenanceRate":-0.02,"freeTroops":6,"recruitAmount":1,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0,"globalDefense":0.15,"ppCapBonus":49,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"PAC","id":"PAC_western_states","pathIds":["PAC_emergency_assembly","PAC_west_convention","PAC_hollywood_path","PAC_wartime_studios","PAC_hearst_press","PAC_media_monopoly","PAC_western_states","PAC_west_coast_showcase","PAC_california_century","PAC_new_pacific_order"],"ideology":"fascism","expected":{"moneyIncome":2,"ppIncome":1.5,"maintenanceRate":-0.03,"freeTroops":0,"recruitAmount":0,"recruitCost":0,"captureMoney":5,"captureTroops":1,"globalAttack":0.15,"globalDefense":0,"ppCapBonus":-22,"actionCost:move":-1,"actionCost:build":-1}},
    {"factionId":"PAC","id":"PAC_spiritual_order","pathIds":["PAC_emergency_assembly","PAC_west_convention","PAC_spiritualist_path","PAC_theosophy","PAC_sacred_assembly","PAC_hubbard_order","PAC_paranormal_division","PAC_spiritual_order","PAC_great_awakening","PAC_west_coast_showcase","PAC_california_century","PAC_new_pacific_order"],"ideology":"pacific_spiritualism","expected":{"moneyIncome":2,"ppIncome":4,"maintenanceRate":-0.02,"freeTroops":12,"recruitAmount":2,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0.1,"globalDefense":0.05,"ppCapBonus":43,"actionCost:move":0,"actionCost:build":-1}},
    {"factionId":"WDC","id":"WDC_command_state","pathIds":["WDC_command_post","WDC_rocky_council","WDC_junta_path","WDC_staff_orders","WDC_officer_governors","WDC_personalist_command","WDC_desert_discipline","WDC_command_state","WDC_western_command_state","WDC_rocky_mandate"],"ideology":"military_junta","expected":{"moneyIncome":0,"ppIncome":2,"maintenanceRate":-0.04,"freeTroops":10,"recruitAmount":0,"recruitCost":0,"captureMoney":0,"captureTroops":0,"globalAttack":0.1,"globalDefense":0.1,"ppCapBonus":0,"actionCost:move":-1,"actionCost:build":0}},
    {"factionId":"WDC","id":"WDC_frontier_republic_wdc","pathIds":["WDC_command_post","WDC_rocky_council","WDC_frontier_federation","WDC_mountain_states_pact","WDC_montana_delegation","WDC_homestead_bloc","WDC_homestead_democracy","WDC_homestead_acts","WDC_frontier_republic_wdc","WDC_western_federation","WDC_rocky_mandate"],"ideology":"frontier_republic","expected":{"moneyIncome":2,"ppIncome":2,"maintenanceRate":-0.02,"freeTroops":9,"recruitAmount":6,"recruitCost":-1,"captureMoney":0,"captureTroops":0,"globalAttack":0,"globalDefense":0,"ppCapBonus":-26,"actionCost:move":0,"actionCost:build":0}},
    {"factionId":"TEX","id":"TEX_lone_star_irredenta","pathIds":["TEX_provisional_government","TEX_state_convention","TEX_lone_star_republic","TEX_republic_proclaimed","TEX_lone_star_council","TEX_border_restoration","TEX_old_republic_borders","TEX_lone_star_irredenta","TEX_lone_star_destiny","TEX_lone_star_mandate"],"ideology":"lone_star_nationalism","expected":{"moneyIncome":0,"ppIncome":1,"maintenanceRate":-0.02,"freeTroops":4,"recruitAmount":2,"recruitCost":-1,"captureMoney":0,"captureTroops":2,"globalAttack":0.13,"globalDefense":0,"ppCapBonus":-16,"actionCost:move":-1,"actionCost:build":0}}
];

test('American route upgrades retain their distinct military and economic packages', async t => {
    const root = path.resolve(__dirname, '..');
    const ctx = vm.createContext({ console, setTimeout, clearTimeout,
        document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, body: { classList: { toggle() {} } } },
        location: { hash: '', origin: 'http://localhost', pathname: '/' }, matchMedia: () => ({ matches: false }) });
    ctx.window = ctx;
    for (const [, file] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(js\/[^"?]+)\?v=/g)) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    }
    const { GameState, MapData, App } = vm.runInContext('({ GameState, MapData, App })', ctx);
    const readers = {
        moneyIncome: () => GameState.getMoneyIncomeBonus(),
        ppIncome: () => GameState.getTurnPPIncome() - GameState.basePPIncome,
        maintenanceRate: () => GameState.getMaintenanceRate() - GameState.baseMaintenanceRate,
        freeTroops: () => GameState.getEffectiveFreeTroops(),
        recruitAmount: () => GameState.getEffectiveRecruitAmount(),
        recruitCost: () => GameState.getEffectiveRecruitCostDelta(),
        captureMoney: () => GameState.getEffectiveCaptureMoney(),
        captureTroops: () => GameState.getEffectiveCaptureTroops(),
        globalAttack: () => GameState.getEffectiveGlobalAttack(),
        globalDefense: () => GameState.getEffectiveGlobalDefense(),
        ppCapBonus: () => GameState.getEffectivePPCap() - GameState.ppCap,
        'actionCost:move': () => GameState.getActionBaseCostAdjustment('move'),
        'actionCost:build': () => GameState.getActionBaseCostAdjustment('build')
    };
    for (const route of routes) await t.test(route.id, () => {
        GameState.initLocalLobby('america');
        GameState.takeSlot(route.factionId);
        GameState.startGameSession();
        const capital = MapData.getNode(GameState.getCapitalNodeId(route.factionId));
        for (const id of route.pathIds) {
            const focus = GameState.getFocusById(id, route.factionId);
            assert.ok(focus, id);
            for (const effect of focus.effects || []) App.applyFocusEffect(effect, route.factionId, capital);
        }
        assert.equal(GameState.game.currentIdeology, route.ideology);
        for (const [key, want] of Object.entries(route.expected)) {
            assert.ok(Math.abs(readers[key]() - want) < 1e-7, `${route.id}: ${key} expected ${want}, got ${readers[key]()}`);
        }
    });
});
