"""Build the campaign map from us-atlas 3.0.1 counties-albers-10m.json."""

import argparse
import heapq
import json
import math
from collections import defaultdict
from pathlib import Path


# Each existing game province is anchored to its capital or namesake city county.
SEEDS = {
    "SEA": "53033", "POR": "41051", "SFO": "06075", "SAC": "06067", "LAX": "06037",
    "BOI": "16001", "BIL": "30111", "RNO": "32031", "SLC": "49035", "DEN": "08031",
    "PHX": "04013", "ABQ": "35001", "FGO": "38017", "OMA": "31055", "KAN": "29095",
    "OKC": "40109", "STL": "29510", "LRK": "05119", "BAT": "22033", "NOL": "22071",
    "HOU": "48201", "MSP": "27053", "MIL": "55079", "CHI": "17031", "DET": "26163",
    "CLE": "39035", "PIT": "42003", "WAS": "11001", "BAL": "24510", "PHI": "42101",
    "NYC": "36061", "RIC": "51760", "NOR": "51710", "ALB": "36001", "HFD": "09003",
    "BOS": "25025", "MNE": "23019", "ATL": "13121", "BHM": "01073", "CHA": "37119",
    "CLM": "45079", "SAV": "13051", "JAX": "12031", "ELP": "48141", "DAL": "48113", "DLH": "27137", "CAM": "34007",
    "SAT": "48029",
}
EXCLUDED = {"02", "15", "60", "66", "69", "72", "78"}

# KX's federal collapse with New England and an independent Texas. States
# split in KX are approximated by whole counties, using projected county
# centers for the interior cut lines and county IDs for named coastal areas.
STATE_GROUPS = {
    "PAC": "06 41 53",
    "WDC": "04 08 16 32 35 49 56",
    "AUS": "05 19 20 22 27 29 30 31 38 40 46 55",
    "CSA": "17 18 26 34 39 42",
    "USA": "10 11 24 51 54",
    "NEN": "09 23 25 33 36 44 50",
    "CON": "01 12 13 21 28 37 45 47",
    "TEX": "48",
}
STATE_OWNER = {state: faction for faction, states in STATE_GROUPS.items() for state in states.split()}


def opening_owner(county, center):
    state = county[:2]
    x, y = center

    if state == "32" and x < 137 and y > 229:
        return "PAC"  # western Nevada; the Reno–Carson area is WDC
    if state == "30" and x < 270:
        return "WDC"  # western Montana
    if (state == "08" and x > 358) or (state == "35" and x > 345) or (state == "56" and x > 326):
        return "AUS"
    if state == "27" and county in {"27017", "27031", "27075", "27137"}:
        return "CSA"  # Arrowhead and Duluth
    if state == "55" and x > 595:
        return "CSA"  # eastern Wisconsin
    if state == "36" and county in {"36005", "36047", "36059", "36061", "36081", "36085", "36103", "36119"}:
        return "CSA"  # NYC and its lower Hudson / Long Island area
    if state == "34" and y > 231:
        return "USA"  # southern New Jersey
    if state == "29" and y > 301:
        return "CON"  # Missouri south of the Northern Missouri district
    if (state == "17" and y > 297) or (state == "18" and y > 286) or (state == "39" and y > 265):
        return "CON"
    if (state == "51" and x < 805 and y > 305) or (state == "54" and y > 284):
        return "CON"
    if state == "37" and x > 842:
        return "USA"  # the outer North Carolina coast
    return STATE_OWNER[state]



def abs_arc(index):
    return index if index >= 0 else ~index


def county_rings(geometry):
    if geometry["type"] == "Polygon":
        return geometry["arcs"]
    return [ring for polygon in geometry["arcs"] for ring in polygon]


def ring_points(ring, arcs):
    points = []
    for index in ring:
        arc = arcs[abs_arc(index)]
        points.extend((arc if index >= 0 else arc[::-1])[:-1])
    return points


def polygon_center(ring):
    cross = [x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])]
    area = sum(cross)
    if not area:
        return 0, ring[0]
    x = sum((a[0] + b[0]) * c for a, b, c in zip(ring, ring[1:] + ring[:1], cross))
    y = sum((a[1] + b[1]) * c for a, b, c in zip(ring, ring[1:] + ring[:1], cross))
    return abs(area) / 2, (x / (3 * area), y / (3 * area))


def assign_provinces(counties, centers, owners, factions):
    neighbors = defaultdict(set)
    for adjacent in owners.values():
        if len(adjacent) == 2:
            a, b = adjacent
            neighbors[a].add(b)
            neighbors[b].add(a)

    # Grow from the seeds over shared county lines. This keeps the land front
    # contiguous and prevents a lake from becoming an automatic land route.
    best = {county: (0, province) for province, county in SEEDS.items()}
    queue = [(distance, province, county) for county, (distance, province) in best.items()]
    heapq.heapify(queue)
    while queue:
        distance, province, county = heapq.heappop(queue)
        if best[county] != (distance, province):
            continue
        for neighbor in neighbors[county]:
            if factions[neighbor] != factions[county]:
                continue
            step = max(0.1, math.dist(centers[county][1], centers[neighbor][1]))
            candidate = (distance + step, province)
            if candidate < best.get(neighbor, (math.inf, "")):
                best[neighbor] = candidate
                heapq.heappush(queue, (*candidate, neighbor))

    result = {county: province for county, (_, province) in best.items()}
    # Give islands and small disconnected opening pockets to the nearest
    # assigned county on the same side. No land route is added by this step.
    for county in sorted(counties.keys() - result.keys()):
        same_faction = (other for other in best if factions[other] == factions[county])
        closest = min(same_faction, key=lambda other: (math.dist(centers[county][1], centers[other][1]), other))
        result[county] = result[closest]
    return result


def stitch(indices, arcs):
    """Stitch already-oriented exterior arcs, keeping holes as separate rings."""
    starts = defaultdict(list)
    for index in sorted(indices):
        arc = arcs[abs_arc(index)]
        starts[arc[0] if index >= 0 else arc[-1]].append(index)
    remaining = set(indices)
    for first in sorted(indices):
        if first not in remaining:
            continue
        ring = []
        index = first
        while index in remaining:
            remaining.remove(index)
            arc = arcs[abs_arc(index)]
            directed = arc if index >= 0 else arc[::-1]
            ring.extend(directed[:-1])
            if directed[-1] == ring[0]:
                break
            index = next(index for index in starts[directed[-1]] if index in remaining)
        yield ring


def point_text(point):
    return " ".join(f"{value:.1f}".removesuffix(".0") for value in point)


def path(points, closed=False):
    # Compact implicit line-to pairs. Keep all shared coordinates identical.
    return "M" + " ".join(map(point_text, points)) + ("Z" if closed else "")


def river_paths(source, outline, project):
    import shapefile
    from shapely import make_valid, symmetric_difference_all
    from shapely.geometry import LineString, Polygon

    # The lower-48 branch of us-atlas's D3 Albers projection.
    parallels = [math.sin(math.radians(angle)) for angle in (29.5, 45.5)]
    n = sum(parallels) / 2
    c = 1 + parallels[0] * (2 * n - parallels[0])

    def albers(lon, lat):
        radius = math.sqrt(c - 2 * n * math.sin(math.radians(lat))) / n
        angle = n * math.radians(lon)
        return radius * math.sin(angle), radius * math.cos(angle)

    cx, cy = albers(-0.6, 38.7)

    def to_map(lon, lat):
        x, y = albers(lon + 96, lat)
        return project((487.5 + 1300 * (x - cx), 305 + 1300 * (y - cy)))

    land = symmetric_difference_all([make_valid(Polygon(ring)) for ring in outline])
    names = set(("Mississippi Missouri Ohio Tennessee Arkansas Columbia Snake Colorado Grande Pecos Brazos "
                 "Platte Yellowstone Kansas Wabash Illinois Wisconsin Connecticut Hudson Delaware Susquehanna "
                 "Potomac James Savannah Sacramento Cumberland Alabama Red_of_the_South San_Joaquin").split())
    segments = []
    for record in shapefile.Reader(source).iterShapeRecords(fields=["name", "name_en"]):
        name = (record.record.name_en or record.record.name or "").replace(" ", "_")
        min_x, min_y, max_x, max_y = record.shape.bbox
        if name not in names or max_x < -125 or min_x > -65 or max_y < 24 or min_y > 50:
            continue
        starts = [*record.shape.parts, len(record.shape.points)]
        for start, end in zip(starts, starts[1:]):
            line = LineString([to_map(lon, lat) for lon, lat in record.shape.points[start:end]])
            clipped = line.intersection(land).simplify(0.22)
            for piece in getattr(clipped, "geoms", [clipped]):
                if piece.geom_type == "LineString" and piece.length >= 0.7:
                    segments.append(path(list(piece.coords)))
    return "".join(segments)


def build(atlas, rivers=None):
    counties = {
        geometry["id"]: county_rings(geometry)
        for geometry in atlas["objects"]["counties"]["geometries"]
        if geometry["id"][:2] not in EXCLUDED
    }
    transform = atlas["transform"]
    arcs = []
    for arc in atlas["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * transform["scale"][0] + transform["translate"][0],
                           y * transform["scale"][1] + transform["translate"][1]))
        arcs.append(points)

    owners = defaultdict(dict)
    centers = {}
    for county, rings in counties.items():
        centers[county] = max(polygon_center(ring_points(ring, arcs)) for ring in rings)
        for ring in rings:
            for index in ring:
                owners[abs_arc(index)][county] = index

    # Fit the lower 48 states in the game's 1000×620 strategic viewport.
    extent = [point for index in owners for point in arcs[index]]
    min_x, min_y = map(min, zip(*extent))
    max_x, max_y = map(max, zip(*extent))
    scale = min(946 / (max_x - min_x), 552 / (max_y - min_y))

    def project(point):
        x, y = point
        return (round(500 + (x - (min_x + max_x) / 2) * scale, 1),
                round(310 + (y - (min_y + max_y) / 2) * scale, 1))

    factions = {county: opening_owner(county, centers[county][1]) for county in counties}
    assigned = assign_provinces(counties, centers, owners, factions)
    exterior = defaultdict(list)
    borders = defaultdict(list)
    for arc_id, counties_on_arc in owners.items():
        by_province = {assigned[county]: index for county, index in counties_on_arc.items()}
        if len(by_province) == 1 and len(counties_on_arc) > 1:
            continue
        for province, index in by_province.items():
            exterior[province].append(index)
        if len(by_province) == 2:
            borders[tuple(sorted(by_province))].append(arc_id)

    provinces = {}
    for province, seed in SEEDS.items():
        rings = list(stitch(exterior[province], arcs))
        shape = "".join(path(list(map(project, ring)), True) for ring in rings
                        if polygon_center(ring)[0] * scale ** 2 >= 0.15)
        area = sum(info[0] for county, info in centers.items() if assigned[county] == province)
        provinces[province] = [*project(centers[seed][1]), round(area), shape, factions[seed]]

    edges = []
    for (a, b), indices in sorted(borders.items()):
        segments = [list(map(project, arcs[index])) for index in indices]
        edges.append([a, b, "".join(path(segment) for segment in segments)])
    water = ""
    if rivers:
        coast = [next(iter(counties_on_arc.values())) for counties_on_arc in owners.values() if len(counties_on_arc) == 1]
        water = river_paths(rivers, [list(map(project, ring)) for ring in stitch(coast, arcs) if len(ring) >= 3], project)
    return provinces, edges, water


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("atlas", type=Path)
    parser.add_argument("--rivers", type=Path)
    args = parser.parse_args()
    provinces, edges, water = build(json.loads(args.atlas.read_text(encoding="utf-8")), args.rivers)
    destination = Path(__file__).resolve().parents[1] / "js" / "province-geography.js"
    encode = lambda value: json.dumps(value, separators=(",", ":"))
    destination.write_text(
        "// Generated by tools/build-provinces.py from U.S. Census Bureau / us-atlas data.\n"
        "// Natural Earth rivers are public domain. See README.md for data sources.\n"
        "const ProvinceGeography = {\n"
        "    // City x, city y, relative area, province SVG path, starting faction\n"
        "    provinces: {\n"
        + "\n".join(f"        {key}: {encode(value)}," for key, value in provinces.items())
        + "\n    },\n"
        "    // Province pair and their shared border SVG path\n"
        "    borders: [\n"
        + "\n".join(f"        {encode(edge)}," for edge in edges)
        + "\n    ],\n    rivers: " + encode(water) + "\n};\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
