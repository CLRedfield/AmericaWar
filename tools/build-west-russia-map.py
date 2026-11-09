"""Build the West Russia map from OpenStreetMap raions and Natural Earth context."""

import argparse
import heapq
import json
from pathlib import Path

import shapefile
from pyproj import Transformer
from shapely import box, coverage_simplify, make_valid, union_all
from shapely.geometry import Point, Polygon, shape
from shapely.ops import transform
from shapely.strtree import STRtree


# Faction, anchor, province name, lon, lat, industry, garrison, terrain, tags.
SEEDS = [
    ("WRF", "ARK", "阿尔汉格尔斯克", 40.54, 64.54, 4, 7, "白海港口", "首都 港口 铁路 工厂"),
    ("WRF", "PLE", "普列谢茨克", 40.29, 62.71, 2, 3, "针叶林军营", "森林 铁路"),
    ("WRF", "MEZ", "梅津", 44.24, 65.85, 0, 1, "北冰洋河口", "港口 森林"),
    ("WRF", "SHK", "申库尔斯克", 42.90, 62.11, 0, 2, "北德维纳河谷", "河港 森林"),
    ("WRF", "UKH", "乌赫塔", 53.68, 63.57, 2, 4, "油田铁路", "油田 铁路"),
    ("WRF", "PIN", "皮涅加", 43.39, 64.70, 0, 1, "皮涅加河上游林道", "森林"),
    ("WRF", "LSH", "列舒孔斯科耶", 45.76, 64.90, 0, 0, "梅津河内陆渡口", "河港 森林"),
    ("WRF", "KTL", "科特拉斯", 46.65, 61.25, 1, 1, "北德维纳铁路桥", "河港 铁路"),
    ("WRF", "NRM", "纳里扬马尔", 53.00, 67.64, 1, 0, "伯朝拉河下游港口", "港口"),
    ("WRF", "NYA", "尼扬多马", 40.20, 61.67, 0, 1, "北方铁路车辆段", "铁路 森林"),
    ("WRF", "KHM", "霍尔莫戈雷", 41.65, 64.23, 0, 1, "北德维纳河沿岸", "河港 森林"),
    ("WRF", "VLS", "韦利斯克", 42.10, 61.07, 1, 1, "瓦加河畔的南线车站", "铁路 粮区"),
    ("WRF", "KNS", "科诺沙", 40.26, 60.98, 0, 1, "北方铁路分岔站", "铁路 森林"),
    ("WRF", "OKT", "十月镇", 43.17, 61.09, 0, 1, "乌斯季亚河林区", "森林"),

    ("ONE", "ONG", "奥涅加", 38.11, 63.91, 2, 6, "白海沿岸", "首都 港口 森林 铁路"),
    ("ONE", "PUD", "普多日", 36.53, 61.81, 1, 1, "奥涅加湖东岸", "森林 河港"),
    ("ONE", "KAR", "卡尔戈波尔", 38.95, 61.51, 1, 2, "北方湖区", "森林"),

    ("KOM", "SYK", "瑟克特夫卡尔", 50.83, 61.67, 3, 6, "维切格达河会合处", "首都 河港 工厂"),
    ("KOM", "KUL", "乌斯季库洛姆", 53.67, 61.69, 1, 2, "林间河岸", "森林 河港"),
    ("KOM", "KOI", "科伊戈罗多克", 51.01, 60.45, 0, 2, "林业定居点", "森林"),
    ("KOM", "KNY", "克尼亚日波戈斯特", 50.87, 62.63, 1, 2, "北方干线", "森林 铁路"),
    ("KOM", "UVM", "乌斯季维姆", 50.41, 62.23, 1, 1, "维姆河口转运站", "河港 铁路"),
    ("KOM", "LOK", "洛克奇姆", 52.82, 61.02, 0, 0, "洛克奇姆河林区", "森林"),
    ("KOM", "LET", "列特卡", 49.40, 59.61, 0, 1, "科米南端粮道", "粮区 森林"),

    ("VOL", "VLG", "沃洛格达", 39.89, 59.22, 3, 5, "铁路会合处", "首都 铁路 工厂"),
    ("VOL", "CHE", "切列波韦茨", 37.91, 59.12, 3, 2, "舍克斯纳河岸", "河港 工厂"),
    ("VOL", "TOT", "托季马", 42.76, 59.97, 1, 2, "苏霍纳河", "河港 森林"),
    ("VOL", "UST", "大乌斯秋格", 46.31, 60.76, 0, 2, "北德维纳河上游", "河港 森林"),
    ("VOL", "VYG", "维捷格拉", 36.45, 61.01, 1, 1, "伏尔加—波罗的海航道", "河港"),
    ("VOL", "KIR", "基里洛夫", 38.38, 59.86, 0, 1, "白湖以东的林间道路", "森林"),
    ("VOL", "BAB", "巴巴耶沃", 35.94, 59.38, 0, 1, "西部干线车站", "铁路 森林"),
    ("VOL", "NIK", "尼科利斯克", 45.46, 59.53, 0, 0, "尤格河谷", "粮区 森林"),
    ("VOL", "GAL", "加利奇", 42.34, 58.38, 0, 1, "加利奇湖铁路枢纽", "铁路 森林"),
    ("VOL", "SRY", "沙里亚", 45.51, 58.36, 1, 1, "韦特卢加河林区", "铁路 森林"),
    ("VOL", "SHA", "沙胡尼亚", 46.61, 57.68, 1, 2, "北向铁路", "铁路 森林"),

    ("GEO", "GAY", "盖内", 54.33, 60.30, 2, 5, "卡马河上游", "首都 河港 森林"),
    ("GEO", "KOS", "科萨", 54.99, 59.95, 1, 2, "上卡马林区", "森林"),
    ("GEO", "YUR", "尤尔拉", 54.34, 59.33, 0, 2, "森林驿道", "森林 粮区"),
    ("GEO", "KOC", "科切沃", 54.32, 59.60, 0, 1, "堂区粮食中转站", "森林 粮区"),
    ("GEO", "NYR", "内罗布", 56.32, 60.73, 1, 0, "北乌拉尔山前道路", "森林 山地"),
    ("GEO", "TPC", "特罗伊茨科伯朝尔斯克", 56.19, 62.71, 1, 1, "伯朝拉河上游渡口", "河港 森林"),

    ("VYA", "VYT", "维亚特卡", 49.67, 58.60, 3, 6, "维亚特卡河枢纽", "首都 铁路 河港"),
    ("VYA", "KOT", "科捷利尼奇", 48.35, 58.31, 1, 2, "西向铁路", "铁路 粮区"),
    ("VYA", "OMU", "奥穆特宁斯克", 52.17, 58.67, 1, 2, "矿冶林区", "矿区 森林 工厂"),
    ("VYA", "IZH", "伊热夫斯克", 53.21, 56.85, 2, 2, "兵工制造区", "工厂 铁路"),
    ("VYA", "URZ", "乌尔茹姆", 50.00, 57.11, 1, 2, "南方粮区", "粮区 河港"),
    ("VYA", "OPA", "奥帕里诺", 48.28, 59.85, 0, 1, "北向林场铁路", "森林 铁路"),
    ("VYA", "ZUE", "祖耶夫卡", 51.13, 58.40, 0, 1, "维亚特卡以东铁路站", "铁路 粮区"),
    ("VYA", "YAR", "亚兰斯克", 47.88, 57.30, 0, 1, "西南方谷仓", "粮区"),
    ("VYA", "GLZ", "格拉佐夫", 52.66, 58.14, 1, 1, "切普察河工业区", "工厂 铁路"),
    ("VYA", "SRP", "萨拉普尔", 53.80, 56.48, 1, 0, "卡马河西岸工厂", "工厂 河港"),

    ("PRM", "PER", "彼尔姆", 56.23, 58.01, 3, 6, "卡马河工业城", "首都 河港 铁路 工厂"),
    ("PRM", "BER", "别列兹尼基", 56.79, 59.41, 1, 2, "盐矿工业带", "矿区 工厂"),
    ("PRM", "CHU", "丘索沃伊", 57.82, 58.29, 1, 2, "乌拉尔山口", "山地 矿区 铁路"),
    ("PRM", "KUN", "昆古尔", 56.94, 57.42, 1, 2, "山脚仓场", "山地 铁路"),
    ("PRM", "CHA", "柴可夫斯基", 54.12, 56.77, 1, 2, "卡马水坝", "河港"),
    ("PRM", "KIZ", "基泽尔", 57.65, 59.05, 1, 1, "基泽尔煤田", "矿区 铁路"),
    ("PRM", "GOR", "戈尔诺扎沃茨克", 58.31, 58.38, 0, 1, "乌拉尔西坡山口", "山地 铁路"),
    ("PRM", "NYT", "内特瓦", 55.33, 57.94, 1, 1, "卡马河右岸的轧钢工厂", "工厂 河港"),
    ("PRM", "OSA", "奥萨", 55.45, 57.28, 0, 0, "卡马河弯渡口", "河港 粮区"),
    ("PRM", "CNU", "切尔努什卡", 56.08, 56.51, 0, 1, "南线铁路与油田", "铁路 油田"),

    ("GOR", "GKY", "高尔基", 44.00, 56.33, 4, 6, "伏尔加河汽车工厂", "首都 河港 工厂"),
    ("GOR", "SEM", "谢苗诺夫", 44.50, 57.15, 1, 2, "林业工坊", "森林 铁路"),
    ("GOR", "LYS", "利斯科沃", 45.04, 56.03, 0, 2, "伏尔加河航道", "河港 粮区"),
    ("GOR", "GDT", "戈罗杰茨", 43.47, 56.65, 1, 1, "伏尔加河水电枢纽", "河港 工厂"),
    ("GOR", "ARZ", "阿尔扎马斯", 43.84, 55.39, 1, 1, "奥卡河以东的铁路节点", "铁路 粮区"),

    ("TAT", "KAZ", "喀山", 49.12, 55.79, 3, 6, "伏尔加河大学城", "首都 河港 铁路 工厂"),
    ("TAT", "CEB", "切博克萨雷", 47.25, 56.13, 1, 2, "西部渡口", "河港 粮区"),
    ("TAT", "MAR", "约什卡尔奥拉", 47.89, 56.63, 1, 2, "马里林区", "森林 铁路"),
    ("TAT", "ALA", "阿拉特里", 46.58, 54.84, 0, 1, "苏拉河畔的西南门户", "河港 铁路"),
    ("TAT", "ZEL", "泽列诺多尔斯克", 48.52, 55.85, 1, 1, "喀山以西的伏尔加铁路桥", "河港 铁路 工厂"),
    ("TAT", "MAM", "马马德什", 51.40, 55.71, 0, 1, "维亚特卡河汇入卡马河处", "河港 粮区"),
    ("TAT", "CSP", "奇斯托波尔", 50.64, 55.37, 1, 0, "卡马河南岸制表工业", "河港 工厂"),
    ("TAT", "NUR", "努尔拉特", 50.81, 54.43, 1, 1, "卡马河南部的铁路油站", "油田 铁路 粮区"),

    ("SAM", "SAM", "萨马拉", 50.14, 53.20, 4, 7, "伏尔加河工业港", "首都 河港 工厂 铁路"),
    ("SAM", "SYZ", "塞兹兰", 48.46, 53.16, 1, 2, "南线桥头", "河港 铁路"),
    ("SAM", "ULY", "乌里扬诺夫斯克", 48.40, 54.32, 2, 2, "伏尔加河中游", "河港 工厂"),
    ("SAM", "STA", "伏尔加河畔斯塔夫罗波尔", 49.40, 53.52, 1, 2, "水电工地", "河港 工厂"),
    ("SAM", "INZ", "因扎", 46.35, 53.86, 0, 1, "伏尔加以西铁路联络线", "铁路 森林"),
    ("SAM", "MLK", "梅列克斯", 49.61, 54.22, 1, 1, "伏尔加东岸工业镇", "工厂 粮区"),
    ("SAM", "PKV", "波赫维斯特涅沃", 52.13, 53.65, 1, 1, "东线铁路油料站", "铁路 油田"),
    ("SAM", "BLG", "大格卢希察", 50.46, 52.40, 0, 0, "萨马拉以南的草原粮道", "粮区"),
    ("SAM", "CEL", "卡马河畔切尔内", 52.40, 55.73, 1, 2, "卡马河码头", "河港 工厂"),
    ("SAM", "ALM", "阿尔梅季耶夫斯克", 52.30, 54.90, 2, 2, "东南油田", "油田 粮区"),
    ("SAM", "AGR", "阿格雷兹", 52.99, 56.52, 0, 1, "通往伊热夫斯克的铁路站", "铁路"),
    ("SAM", "BUZ", "布祖卢克", 52.26, 52.78, 1, 1, "萨马拉河铁路枢纽", "铁路 粮区"),

    ("BSH", "UFA", "乌法", 56.00, 54.73, 3, 6, "别拉亚河口", "首都 河港 铁路 工厂"),
    ("BSH", "STE", "斯捷尔利塔马克", 55.95, 53.63, 2, 2, "炼油走廊", "油田 工厂"),
    ("BSH", "BEL", "别洛列茨克", 58.40, 53.97, 1, 2, "南乌拉尔铁矿", "山地 矿区"),
    ("BSH", "BIR", "比尔斯克", 55.54, 55.42, 0, 2, "河谷农区", "河港 粮区"),
    ("BSH", "YAN", "亚纳乌尔", 54.93, 56.28, 0, 1, "通往北卡马的铁路口", "铁路 粮区"),
    ("BSH", "TYZ", "图伊马济", 53.70, 54.60, 1, 1, "西部油田走廊", "油田 铁路"),
    ("BSH", "DUV", "杜万", 57.90, 55.69, 0, 0, "乌拉尔西麓山谷", "山地 粮区"),
]

LABELS = [
    ("白海", 36.5, 66.9), ("芬兰共和国", 30.2, 63.4), ("莫斯科专员辖区", 36.4, 55.9),
    ("沃尔库塔", 67.25, 66.3), ("尤格拉", 65.0, 61.5), ("兹拉托乌斯特", 62.0, 57.1), ("奥伦堡公社", 55.5, 51.4),
]


def parts(geometry, kind):
    if geometry.is_empty:
        return
    if geometry.geom_type == kind:
        yield geometry
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from parts(part, kind)


def projected_shapes(admin, project):
    layer = shapefile.Reader(admin)
    study = box(-3, 35, 105, 82)
    context = []
    regions = {}
    for record in layer.iterShapeRecords(fields=["iso_3166_2", "adm0_a3"]):
        if not box(*record.shape.bbox).intersects(study):
            continue
        geometry = make_valid(shape(record.shape.__geo_interface__)).intersection(study)
        if geometry.is_empty:
            continue
        geometry = transform(project, geometry)
        context.append(geometry)
        if record.record.adm0_a3 == "RUS":
            regions[record.record.iso_3166_2.removeprefix("RU-")] = geometry
    return regions, union_all(context)


def opening_territories(regions, project):
    def combine(*codes):
        return union_all([regions[code] for code in codes])

    def mask(points):
        return transform(project, Polygon(points))

    # Reference outlines pick whole districts. Their edges are never used to draw provinces.
    onega_front = mask([(36.0, 64.85), (39.4, 64.85), (39.2, 62.7), (39.5, 61.05),
                        (38.0, 60.7), (35.7, 61.05), (35.95, 62.4), (36.9, 63.3)])
    north_line = mask([(44, 70), (66, 70), (66, 64.0), (58.2, 64.0),
                       (56.4, 63.2), (52.6, 63.05), (48.1, 62.9), (44, 63.4)])
    komi_limit = mask([(44, 68), (59.8, 68), (61.9, 65.0), (60.5, 62.2),
                       (59.7, 59.0), (43, 59.0)])
    komi_west = combine("ARK", "KIR").intersection(mask([
        (47.05, 61.02), (47.32, 61.66), (48.4, 62.26), (50.9, 62.0),
        (49.85, 60.05), (48.6, 60.24), (46.7, 60.45),
    ]))
    order_limit = mask([(51, 63), (57, 63), (56.35, 60.2), (55.6, 59.62),
                        (55.0, 59.08), (51, 59.08)])
    gayny_north = mask([(53.9, 60.1), (54.4, 62.55), (55.35, 63.6), (59.2, 63.6),
                        (60.0, 61.6), (59.5, 59.5), (54, 59.5)])
    vologda_south = combine("KOS", "NIZ").intersection(mask([
        (40.0, 59.75), (48.2, 59.75), (48.2, 57.3), (46.1, 57.36),
        (44.1, 57.9), (41.55, 57.93), (40.0, 58.22),
    ]))
    gorky_core = regions["NIZ"].intersection(mask([
        (42.65, 54.85), (46.7, 54.85), (47.6, 56.5), (47.1, 57.55), (43.0, 57.63), (42.45, 56.55),
    ]))
    samara_east = combine("TA", "ORE").intersection(mask([
        (52.65, 56.6), (53.9, 56.65), (54.5, 55.85), (54.55, 53.64),
        (54.1, 52.17), (53.05, 50.5), (50.5, 50.6), (50.9, 53.56),
        (51.45, 54.45), (51.75, 55.42), (51.95, 56.05),
    ]))
    samara_west = regions["MO"].intersection(mask([
        (45.5, 54.1), (46.65, 53.9), (47.24, 54.8), (46.4, 55.01), (45.25, 55.08),
    ]))
    onega = combine("KR", "ARK").intersection(onega_front)
    komi = regions["KO"].intersection(komi_limit)
    upper_kama = regions["PER"].intersection(order_limit)
    gayny = upper_kama.union(komi.intersection(gayny_north).difference(north_line))
    mainland_north = combine("ARK", "NEN").intersection(mask([
        (27, 59), (65, 59), (65, 69.3), (27, 69.3),
    ]))
    return {
        "WRF": mainland_north.difference(onega.union(komi_west)).union(komi.intersection(north_line)),
        "ONE": onega,
        "KOM": komi.difference(north_line.union(gayny)).union(komi_west),
        "VOL": regions["VLG"].union(vologda_south),
        "GEO": gayny,
        "VYA": combine("KIR", "UD").difference(komi_west),
        "PRM": regions["PER"].difference(upper_kama),
        "GOR": gorky_core.difference(vologda_south),
        "TAT": combine("TA", "ME", "CU").difference(samara_east),
        "SAM": combine("SAM", "ULY").union(samara_west).union(samara_east),
        "BSH": regions["BA"].intersection(mask([
            (52.7, 56.8), (58.8, 56.8), (58.7, 54.25), (58.25, 53.35), (56.9, 52.2), (53.3, 52.2),
        ])),
    }


def read_districts(source, project):
    bounds = box(32, 49, 66, 71)
    ids, geometries = [], []
    features = json.loads(source.read_text(encoding="utf-8"))["features"]
    for feature in sorted(features, key=lambda row: row["properties"]["shapeID"]):
        raw = shape(feature["geometry"])
        if raw.is_empty or not box(*raw.bounds).intersects(bounds):
            continue
        # Exclude distant island components outside the map, such as Franz Josef Land.
        polygons = [transform(project, polygon) for polygon in parts(make_valid(raw), "Polygon")
                    if polygon.intersects(bounds)]
        if polygons:
            ids.append(feature["properties"]["shapeID"])
            geometries.append(make_valid(union_all(polygons)))
    return ids, geometries


def district_neighbors(geometries, tree, selected):
    neighbors = {index: {} for index in selected}
    for left in sorted(selected):
        edge = geometries[left].boundary
        vicinity = edge.buffer(45)
        for right in tree.query(vicinity, predicate="intersects"):
            if right <= left or right not in selected:
                continue
            shared = vicinity.intersection(geometries[right].boundary).length
            if shared >= 650:
                neighbors[left][right] = shared
                neighbors[right][left] = shared
    return neighbors


def province_cells(source, domains, project):
    district_ids, districts = read_districts(source, project)
    tree = STRtree(districts)
    territory_ids = list(domains)
    territory_tree = STRtree(list(domains.values()))
    owners = {}
    for index, district in enumerate(districts):
        overlaps = [(district.intersection(domains[territory_ids[match]]).area, territory_ids[match])
                    for match in territory_tree.query(district, predicate="intersects")]
        area, faction = max(overlaps, default=(0, None))
        if area >= district.area * 0.46:
            owners[index] = faction

    cities, anchors, capitals = {}, {}, {}
    for faction, code, _, lon, lat, _, _, _, tags in SEEDS:
        point = Point(project(lon, lat))
        matches = tree.query(point, predicate="intersects")
        if len(matches) == 0:
            raise ValueError(f"{code} does not lie in a source district")
        district = min(matches, key=lambda match: districts[match].area)
        if district in anchors:
            raise ValueError(f"{code} shares a district with {anchors[district]}")
        anchors[district], owners[district] = code, faction
        cities[code] = point.coords[0]
        if "首都" in tags.split():
            capitals[faction] = district

    neighbors = district_neighbors(districts, tree, set(owners))
    connected = set()
    for faction, capital in capitals.items():
        reachable = {capital}
        pending = [capital]
        for index in pending:
            for neighbor in neighbors[index]:
                if owners[neighbor] == faction and neighbor not in reachable:
                    pending.append(neighbor)
                    reachable.add(neighbor)
        connected.update(reachable)

    detached = {code for index, code in anchors.items() if index not in connected}
    if detached:
        raise ValueError(f"Disconnected city districts: {', '.join(sorted(detached))}")

    # Dissolve contiguous districts into playable provinces using nearest land routes.
    # The predecessor is already in the province, so no grouped province can jump a border.
    centers = [geometry.representative_point() for geometry in districts]
    queue = [(0, code, index) for index, code in anchors.items()]
    heapq.heapify(queue)
    allocated = {}
    groups = {code: [] for code in cities}
    while queue:
        distance, code, index = heapq.heappop(queue)
        if index in allocated:
            continue
        allocated[index] = code
        groups[code].append(index)
        for neighbor in neighbors[index]:
            if neighbor not in allocated and neighbor in connected and owners[index] == owners[neighbor]:
                heapq.heappush(queue, (distance + centers[index].distance(centers[neighbor]), code, neighbor))

    # Small detached pieces follow their longest shared edge without cutting the source geometry.
    pending = set(owners) - connected
    while pending:
        attached = {}
        for index in pending:
            edges = [(length, allocated[neighbor]) for neighbor, length in neighbors[index].items()
                     if neighbor in allocated]
            if edges:
                attached[index] = max(edges)[1]
        if not attached:
            break
        for index, code in sorted(attached.items()):
            groups[code].append(index)
            allocated[index] = code
        pending.difference_update(attached)

    cells = {code: union_all([districts[index] for index in indices]) for code, indices in groups.items()}
    sources = {f"WR_{code}": sorted(district_ids[index] for index in indices) for code, indices in groups.items()}
    return cells, cities, sources


def river_lines(rivers, project, theatre):
    layer = shapefile.Reader(rivers)
    names = {"Volga", "Kama", "Northern Dvina", "Sukhona", "Vyatka", "Pechora", "Belaya", "Oka",
             "Vychegda", "Northern Dvina River", "White Sea–Baltic Canal"}
    bounds = box(28, 50, 66, 69)
    for record in layer.iterShapeRecords(fields=["name", "name_en"]):
        if record.record.name not in names and record.record.name_en not in names:
            continue
        if box(*record.shape.bbox).intersects(bounds):
            yield transform(project, shape(record.shape.__geo_interface__)).intersection(theatre).simplify(2400)


def make_map(admin, rivers, raions):
    project = Transformer.from_crs(
        4326, "+proj=lcc +lat_1=53 +lat_2=65 +lat_0=59 +lon_0=47.5 +datum=WGS84",
        always_xy=True,
    ).transform
    regions, context = projected_shapes(admin, project)
    domains = opening_territories(regions, project)
    cells, cities, sources = province_cells(raions, domains, project)
    theatre = union_all(list(cells.values()))
    drawing_cells = dict(zip(cells, coverage_simplify(list(cells.values()), 1850)))
    min_x, min_y, max_x, max_y = theatre.bounds
    scale = min(846 / (max_x - min_x), 536 / (max_y - min_y))
    center_x, center_y = (min_x + max_x) / 2, (min_y + max_y) / 2

    def to_screen(x, y):
        return round(500 + (x - center_x) * scale, 1), round(310 - (y - center_y) * scale, 1)

    def path(coords, close=False):
        points = []
        for x, y in coords:
            point = to_screen(x, y)
            if not points or point != points[-1]:
                points.append(point)
        if len(points) < (4 if close else 2):
            return ""
        numbers = (f"{x:g} {y:g}" for x, y in (points[:-1] if close else points))
        return "M" + " ".join(numbers) + ("Z" if close else "")

    def polygon_paths(geometry, min_area=0.06):
        return "".join(
            path(poly.exterior.coords, True) + "".join(path(ring.coords, True) for ring in poly.interiors)
            for poly in parts(geometry, "Polygon") if poly.area * scale ** 2 >= min_area
        )

    provinces = {}
    nodes = []
    for faction, code, name, _, _, industry, troops, terrain, tags in SEEDS:
        node_id = f"WR_{code}"
        area = max(1, round(cells[code].area * scale ** 2))
        x, y = to_screen(*cities[code])
        provinces[node_id] = [x, y, area, polygon_paths(drawing_cells[code]), faction]
        node = dict(id=node_id, abbr=code, name=name, factionId=faction, x=x, y=y,
                    industry=industry, troops=troops, terrain=terrain, tags=tags.split())
        if "首都" in node["tags"]:
            node["isCapital"] = True
        nodes.append(node)

    borders = []
    codes = sorted(cells)
    for index, left in enumerate(codes):
        for right in codes[index + 1:]:
            if cells[left].distance(cells[right]) > 45:
                continue
            # A narrow tolerance accounts for vertices independently generalized by the source.
            edge = cells[left].boundary.intersection(cells[right].boundary.buffer(45))
            lines = [line for line in parts(edge, "LineString") if line.length * scale > 0.12]
            if sum(line.length for line in lines) * scale < 1.4:
                continue
            border = "".join(path(line.simplify(1850).coords) for line in lines)
            borders.append([f"WR_{left}", f"WR_{right}", border])

    clip = box(center_x - 505 / scale, center_y - 315 / scale,
               center_x + 505 / scale, center_y + 315 / scale)
    return {
        "nodes": nodes,
        "provinces": provinces,
        "districts": sources,
        "borders": borders,
        "surroundings": polygon_paths(context.intersection(clip).simplify(3200), 1.0),
        "rivers": "".join(path(line.coords) for river in river_lines(rivers, project, theatre)
                          for line in parts(river, "LineString")),
        "labels": [[name, *to_screen(*project(lon, lat))] for name, lon, lat in LABELS],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("admin", type=Path)
    parser.add_argument("rivers", type=Path)
    parser.add_argument("raions", type=Path)
    args = parser.parse_args()
    result = make_map(args.admin, args.rivers, args.raions)
    destination = Path(__file__).resolve().parents[1] / "js/scenarios/west-russia-map.js"
    encode = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    with destination.open("w", encoding="utf-8") as output:
        output.write("// Generated by tools/build-west-russia-map.py. District geometry © OpenStreetMap contributors via geoBoundaries, ODbL 1.0.\n")
        output.write("// https://www.openstreetmap.org/copyright • Natural Earth context and rivers are public domain.\n")
        output.write("const WestRussiaGeography = {\n")
        for key, value in result.items():
            if isinstance(value, dict):
                output.write(f"    {key}: {{\n")
                for name, item in value.items():
                    output.write(f"        {encode(name)}: {encode(item)},\n")
                output.write("    },\n")
            elif isinstance(value, list):
                output.write(f"    {key}: [\n")
                for item in value:
                    output.write(f"        {encode(item)},\n")
                output.write("    ],\n")
            else:
                output.write(f"    {key}: {encode(value)},\n")
        output.write("};\n")


if __name__ == "__main__":
    main()
