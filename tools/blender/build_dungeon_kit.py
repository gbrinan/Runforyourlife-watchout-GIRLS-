import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = ROOT / "blender" / "dungeon-kit.blend"
GLB_PATH = ROOT / "public" / "assets" / "dungeon-kit.glb"


def material(name: str, color: tuple[float, float, float, float], metallic: float, roughness: float):
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    value.diffuse_color = color
    value.metallic = metallic
    value.roughness = roughness
    principled = value.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    return value


def cube(name: str, location: tuple[float, float, float], scale: tuple[float, float, float], mat, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft stone edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(mat)
    return obj


def cylinder(name: str, location: tuple[float, float, float], radius: float, depth: float, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

stone = material("MAT_damp_stone", (0.035, 0.042, 0.039, 1.0), 0.0, 0.92)
edge = material("MAT_worn_edge", (0.07, 0.065, 0.055, 1.0), 0.0, 0.82)
iron = material("MAT_black_iron", (0.045, 0.055, 0.055, 1.0), 0.78, 0.38)

root = bpy.data.objects.new("KIT_GothicDoorFrame", None)
bpy.context.collection.objects.link(root)
root["asset_role"] = "procedural_dungeon_arch"
root["safe_depth_m"] = 0.28

for side in (-1, 1):
    base = cube(f"GEO_pillar_base_{side:+d}", (side * 1.22, 0, 0.16), (0.34, 0.22, 0.16), edge)
    shaft = cube(f"GEO_pillar_{side:+d}", (side * 1.22, 0, 1.05), (0.23, 0.18, 0.75), stone)
    capital = cube(f"GEO_capital_{side:+d}", (side * 1.22, 0, 1.84), (0.34, 0.22, 0.13), edge)
    for obj in (base, shaft, capital):
        obj.parent = root

for index, angle_degrees in enumerate(range(18, 163, 18)):
    angle = math.radians(angle_degrees)
    radius = 1.23
    x = math.cos(angle) * radius
    z = 1.75 + math.sin(angle) * radius
    block = cube(f"GEO_arch_stone_{index:02d}", (x, 0, z), (0.27, 0.22, 0.20), stone, 0.035)
    block.rotation_euler[1] = math.radians(90 - angle_degrees)
    block.parent = root

lintel = cube("GEO_arch_backing", (0, 0.10, 2.63), (1.55, 0.09, 0.12), edge, 0.025)
lintel.parent = root

for side in (-1, 1):
    chain = cylinder(f"GEO_chain_{side:+d}", (side * 0.72, -0.08, 2.30), 0.025, 0.62, iron)
    chain.parent = root
    ring = cylinder(f"GEO_ring_{side:+d}", (side * 0.72, -0.08, 1.96), 0.08, 0.035, iron)
    ring.rotation_euler[0] = math.pi / 2
    ring.parent = root

for obj in bpy.context.scene.objects:
    obj.select_set(True)

bpy.context.scene["generator"] = "tools/blender/build_dungeon_kit.py"
bpy.context.scene["game_units"] = "meters"
BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
bpy.ops.export_scene.gltf(
    filepath=str(GLB_PATH),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
print(f"BLEND={BLEND_PATH}")
print(f"GLB={GLB_PATH}")
