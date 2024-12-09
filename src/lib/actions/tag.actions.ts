"use server"

import User from "@/database/user.model"
import { connectToDatabase } from "../mongoose"
import { GetAllTagsParams, GetQuestionByTagIdParams, GetTopInteractedTagsParams } from "./shared.types"
import Tag, { ITag } from "@/database/tag.model";
import { FilterQuery } from "mongoose";
import Question from "@/database/question.model";
import Interaction from "@/database/interaction.model";




export async function GetTopInteractedTags(params: GetTopInteractedTagsParams) {

    try {
        connectToDatabase();

        const { userId } = params;



        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Find interactions for the user and group by tags...
        // Find tags from the user's questions
        const questionTags = await Question.aggregate([
            { $match: { author: userId } },      // Match questions by the user
            { $unwind: "$tags" },                // Unwind the tags array
            {
                $group: {                          // Group by tag and count occurrences
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            }
        ]);



        // Find tags from the user's interactions (e.g., answers)
        const interactionTags = await Interaction.aggregate([
            { $match: { user: userId } },        // Match interactions by the user
            { $unwind: "$tags" },                // Unwind the tags array
            {
                $group: {                          // Group by tag and count occurrences
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log("questionTags", questionTags);
        console.log("interactionTags", interactionTags);

        // Combine the question tags and interaction tags
        const combinedTags = [...questionTags, ...interactionTags];

        // Group by tags and sum the counts (combine counts from both questions and interactions)
        const groupedTags = combinedTags.reduce((acc, tag) => {
            if (!acc[tag._id]) {
                acc[tag._id] = { _id: tag._id, count: tag.count };
            } else {
                acc[tag._id].count += tag.count;
            }
            return acc;
        }, {});

        // Convert to an array and sort by count
        const sortedTags = Object.values(groupedTags).sort((a: any, b: any) => b.count - a.count);

        // Limit to top 2 tags
        const topTagIds = sortedTags.slice(0, 2).map((tag: any) => tag._id);

        // Fetch the tag names based on the tag IDs
        const topTags = await Tag.find({ _id: { $in: topTagIds } });

        return topTags.map(tag => ({ _id: tag._id, name: tag.name }));
        // return [{ _id: '1', name: 'Java' }, { _id: '2', name: 'React' }];
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export async function getAllTags(params: GetAllTagsParams) {

    try {
        connectToDatabase();

        const { searchQuery, filter, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        const query: FilterQuery<ITag> = searchQuery ? {
            name: { $regex: new RegExp(searchQuery, "i") }
        } : {};


        let sortOptions = {};

        switch (filter) {
            case "popular":
                sortOptions = { questions: -1 }
                break;
            case "recent":
                sortOptions = { createdOn: -1 }
                break;
            case "name":
                sortOptions = { name: 1 }
                break;
            case "old":
                sortOptions = { createdOn: 1 }
                break;

            default:
                break;
        }


        const tags = await Tag
            .find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalTags = await Tag.countDocuments(query)

        const isNext = totalTags > skipAmount + tags.length;


        return { tags, isNext, totalTags };




    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getQuestionByTagId(params: GetQuestionByTagIdParams) {
    try {
        connectToDatabase();

        const { tagId, page = 1, pageSize = 10, searchQuery } = params;
        const skipAmount = (page - 1) * pageSize;

        const tagFilter: FilterQuery<ITag> = { _id: tagId };

        const tag = await Tag.findOne(tagFilter).populate(
            {
                path: 'questions',
                model: Question,
                match: searchQuery ? {
                    $or:
                        [{ title: { $regex: searchQuery, $options: 'i' } },
                        { tags: { $in: await Tag.find({ name: { $regex: new RegExp(searchQuery, "i") } }).select("_id") } }
                        ]
                } : {},
                options: {
                    sort: { createdAt: -1 },
                    skip: skipAmount,
                    limit: pageSize + 1 // +1 to check if there is next page
                },
                populate: [
                    { path: 'tags', model: Tag, select: "_id name" },
                    { path: 'author', model: User, select: '_id clerkId name picture' }
                ]

            }

        );

        if (!tag) {
            throw new Error('Tag not found');
        }

        const isNext = tag.questions.length > pageSize;

        const questions = tag.questions;
        return { tagTitle: tag.name, questions, isNext, totalTags: tag.questions?.length || 0 }


    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTopPopularTags() {
    try {
        connectToDatabase();

        const popularTags = await Tag.aggregate(
            [
                {
                    $project: {
                        name: 1, numberOfQuestions: { $size: "$questions" }
                    }
                },
                {
                    $sort: { numberOfQuestions: -1 }
                },
                {
                    $limit: 5
                }
            ]
        );

        return popularTags;

    } catch (error) {
        console.log(error);
        throw error;
    }
}