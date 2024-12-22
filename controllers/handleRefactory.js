const { asyncWrapper } = require("../utils/handlers");
const { FirstCap } = require("../utils/helpers");



exports.getAllPaginated = function(Model, title) {
    return asyncWrapper(async function(req, res) {
        const docTitle = `${title}s`
        const { limit, page, type } = req.query

        const query = {};
        if (type) query.type = type;

        const paginationOptions = {};
        if (limit) paginationOptions.limit = parseInt(limit);
        if (page) paginationOptions.skip = (parseInt(page) - 1) * paginationOptions.limit;

        const documents = await Model.find(query || {})
            .sort({ createAt: -1 })
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit)
        ;
            
        const totalLength = documents.length;
        if(totalLength == 0) return res.json({
            message: `No ${title} found`,
        });

        const totalPage = totalLength / limit;
        const remainingLength = totalLength - (page * limit);
        const responseData = {
            status: "success",
            totalPage, limit, type,
            currentPage: page,
            totalCounts: totalLength,
            remainingCounts: remainingLength,
        }

        if((remainingLength != totalLength) && remainingLength == 0) {
            return res.json({
                ...responseData,
                message: `No more ${title} found`,
            })
        }
        
        res.status(200).json({
            ...responseData,
            data: { [docTitle]: documents },
        })
    })
}


exports.getAll = function(Model, title) {
    return asyncWrapper(async function(_, res) {
        const docTitle = `${title}s`
        
        const documents = await Model.find({}).sort({ createAt: -1 });
        if(!documents || documents.length < 1) {
            res.json({ message: `No ${title} found!` });
        }

        res.status(200).json({
            status: "success",
            data: { [docTitle]: documents },
            count: documents?.length,
        });
    })
}


exports.getAllMine = function(Model, title) {
    return asyncWrapper(async function(req, res) {
        const userId = req.user._id;
        const docTitle = `${title}s`
        
        const myDocuments = await Model.find({
            creator: userId
        }).sort({ createAt: -1 });

        if(!myDocuments || myDocuments.length < 1) {
            res.json({ message: `No ${title} found!` });
        }

        res.status(200).json({
            status: "success",
            data: { [docTitle]: myDocuments },
            count: myDocuments?.length,
        });
    })
}


exports.getOne = function(Model, title) {
    return asyncWrapper(async function(req, res) {
        const { id } = req.params;

        const document = await Model.findOne({ id });
        if(!document) return res.json({
            message: `No ${title} by that ID!`
        });

        res.status(200).json({
            status: "success",
            data: { [title]: document }
        })
    })
}


exports.createOne = function(Model, title, ownerTitle) {
    return asyncWrapper(async function(req, res) {
        const userId = req.user._id;

        const document = await Model.create({
            [ownerTitle]: userId,
            ...req.body
        });

        res.status(201).json({
            status: "success",
            message: `${FirstCap(title)} created!`,
            data: { [title]: document }
        })
    })
}


exports.updateOne = function(Model, title) {
    return asyncWrapper(async function(req, res) {
        const { id } = req.params;

        const document = await Model.findOne({ id });
        if(!document) return res.json({
            message: `No ${title} by that ID!`
        });

        const updatedDocument = await Model.updateOne(
            { _id: document._id },
            { $set: req.body },
            { runValidators: true, new: true }
        );

        res.status(200).json({
            status: "success",
            message: `${FirstCap(title)} Updated!`,
            data: { [title]: updatedDocument }
        });
    });
}


exports.deleteOne = function(Model, title) {
    return asyncWrapper(async function(req, res) {
        const { id } = req.params;

        const document = await Model.findOne({ id });
        if(!document) return res.json({
            message: `No ${title} by that ID!`
        });

        await Model.deleteOne({ id });

        res.status(200).json({
            status: "success",
            message: `${FirstCap(title)} deleted!`,
            data: null
        })
    })
}