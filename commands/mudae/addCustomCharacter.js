const { SlashCommandBuilder } = require('discord.js');
const { readCsv, } = require('../../helper');
const { stringify } = require('csv-stringify/sync');

const path = require('path');
const fs = require('fs');

module.exports = {
	category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('add_custom_character')
		.setDescription('adds a custom character to the database')
        .addStringOption(option =>
            option.setName('name')
                .setDescription("the character's name")
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
            .setDescription("the character's image")
            .setRequired(false))
        .addStringOption(option =>
            option.setName('image_url')
            .setDescription("the character's image")
            .setRequired(false))
        .addStringOption(option =>
            option.setName('age')
            .setDescription("the character's age")
            .setRequired(false)),
	async execute(interaction) {
        const name = interaction.options.getString('name');
        const age = interaction.options.getString('age') || 'undefined';
        let imageUrl = interaction.options.getString('image_url');
        
        if (!imageUrl) {
            const imageAttachment = interaction.options.getAttachment('image');
            if (imageAttachment) {
                imageUrl = imageAttachment.url;
            }
        }
        
        if (!imageUrl) {
            interaction.reply('please either add a custom image attachment, or a image url for the character')
            return
        }

        const customCharactersDatabase = path.join(__dirname, 'data/custom_characters.csv');

        try {
            let customCharacters = await readCsv(customCharactersDatabase);

            const newCharacter = { Name: name, Age: age, PFP: imageUrl };
            customCharacters.push(newCharacter);

            const updatedCsv = stringify(customCharacters, { header: true });
            fs.writeFileSync(customCharactersDatabase, updatedCsv);

            await interaction.reply(`custom character "${name}" has been added to the database.`);
        } catch (error) {
            console.error('error updating custom characters database:', error);
            await interaction.reply('an error occurred while adding the custom character.');
        }
	},
};