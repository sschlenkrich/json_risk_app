#using Pkg
#Pkg.activate("./.difffusion")

using YAML
using OrderedCollections
using DiffFusion


@info "Run Julia script..."

data = YAML.load_file(".difffusion/parameters.json"; dicttype=OrderedDict{String,Any})
d1 = DiffFusion.deserialise_from_list(data)

data = YAML.load_file(".difffusion/instruments.json"; dicttype=OrderedDict{String,Any})
d2 = DiffFusion.deserialise_from_list(data)

data = YAML.load_file(".difffusion/modelling.json"; dicttype=OrderedDict{String,Any})
d3 = DiffFusion.deserialise_from_list(data)

d = merge(d1, d2, d3)
d["true"] = true
d["false"] = false
d["SobolBrownianIncrements"] = DiffFusion.sobol_brownian_increments
d["LinearPathInterpolation"] = DiffFusion.LinearPathInterpolation

data = YAML.load_file(".difffusion/simulation.json"; dicttype=OrderedDict{String,Any})

o = DiffFusion.deserialise(data["sim/G3-Sobol"], d)
d["sim/G3-Sobol"] = o

o = DiffFusion.deserialise(data["path/G3"], d)
d["path/G3"] = o

o = DiffFusion.deserialise(data["path/G3"], d)
d["path/G3"] = o

o = DiffFusion.deserialise(data["cube/all_legs"], d)
