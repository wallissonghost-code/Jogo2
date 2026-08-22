import bpy, sys
from pathlib import Path

args=sys.argv[sys.argv.index('--')+1:]
src,dst=map(Path,args[:2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(src))

for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH': continue
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    for p in obj.data.polygons: p.use_smooth=True
    # Weighted normal-like cleanup via normal recalculation.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.00005)
    bpy.ops.mesh.normals_make_consistent(inside=False) if hasattr(bpy.ops.mesh,'normals_make_consistent') else None
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)

bpy.ops.export_scene.gltf(filepath=str(dst), export_format='GLB', export_apply=True, export_normals=True, export_texcoords=True, export_materials='EXPORT')
