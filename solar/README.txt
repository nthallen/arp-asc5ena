This directory holds routines to model different solar cell arrays for
use on the StratoCruiser. The models consist of individually placed square
tiles of a configurable size. The coordinates and normal vectors of each
tile are stored in the model structure along with x,y,z coordinates of
each corner (to facilitate visualization using surf()). Various other
fields have been added to the model structure to accomodate more elaborate
requirements.

These functions assemble some more-or-less standard models or pieces:
    StratoCruiser.m: A hemi-ellipsoidal model
    FlatPanel.m: Rectangular flat horizontal model
    SuspendedPayload.m: Model of tiles covering the suspended payload
    PupTent.m: Ellis' original model
    Pyramid.m: A 'hip roof' configuration
    trapezoid.m: An isosceles trapezoid configuration
    tile_trapezoid.m: Less regular trapezoids
    sc_append.m: Merges two models into one
    Hinge.m: Attaches a hinge to an existing model

The following files are Cell-mode scripts I used for exploring:
    Hinges.m: Generate plots of power vs time, compare hinged to flat
    basic_analysis.m: Determine power per unit area for hinged array
    Sayres.m: Single panel of housetop array for reality check
    Calc_ShadeAngles.m: work in progress
    articulate.m: Just notes on how I planned to implement articulated panels

*Note that the latest model (with hinged sides) does not currently have
a function to generate it. It is assembled in the Hinges script, and the
variations were made by commenting out parts of the assembly.

The following functions are the basic tools for analyzing power:
    sc_illuminate.m: Determine the cosine-corrected light intensity on
        each tile.
    sc_draw.m: Generate 3D representation of an illuminated model
    sc_day.m: Calculate power generated throughout a full day.
    sc_day_avi.m: Generate an animation of a day's illumination
    sc_rotation.m: Perform sc_day calculations for all azimuthal
        orientations of the model.
    sc_summary.m: Run sc_rotation for multiple latitudes, plotting
        best and worst case energy.
    sc_group.m: Run sc_rotation for multiple latitudes and dates,
        plotting worst case (most useful for configurations with little
        azimuthal variation, e.g. flat panels or double-hinged)

Other functions:
    sc_shell.m: generate a backing shell for ellipsoidal model for better
        graphics.
    SolarAzEl.m: Calculate solar azimuth, elevation (from Mathworks site)
    test_SolarAzEl.m:
    path_length.m
    draw_panel.m
    sc_check.m: diagnostic to identify bugs
