const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

module.exports = {
    category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('updates the MAL database')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('pages') 
                .setDescription('number of pages to scrape ( page # / 50)')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const pages = interaction.options.getInteger('pages');
        const scriptPath = path.join(__dirname, 'scraper.py');
		const dataPath = path.join(__dirname, 'data/characters.csv');

        let oldCount = 0;
        fs.createReadStream(dataPath)
            .pipe(csv())
            .on('data', () => oldCount++)
            .on('end', () => {
                exec(`py ${scriptPath} ${pages}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`error executing script: ${error.message}`);

                        const embed = new EmbedBuilder()
                            .setTitle('database, execute error')
                            .setDescription(`there was an error running the updater. You were most likely ratelimited by MAL`)
                            .setColor('#ff0000');
                        interaction.editReply({ embeds: [embed] });
                        return;
                    }

                    if (stderr) {
                        console.error(`script error output: ${stderr}`);

                        const embed = new EmbedBuilder()
                            .setTitle('database, script error')
                            .setDescription(`there was an error updating the database.`)
                            .setColor('#ff0000');
                        interaction.editReply({ embeds: [embed] });
                        return;
                    }

                    let newCount = 0;
                    fs.createReadStream(dataPath)
                        .pipe(csv())
                        .on('data', () => newCount++)
                        .on('end', () => {
                            const difference = newCount - oldCount;
                            const change = difference >= 0 ? `added` : `removed`;

                            const embed = new EmbedBuilder()
                                .setTitle('database update')
                                .setDescription(`the character database has been updated successfully!`)
                                .addFields(
                                    { name: 'old character count', value: `${oldCount}`, inline: true },
                                    { name: 'new character count', value: `${newCount}`, inline: true },
                                    { name: 'change', value: `${Math.abs(difference)} ${change}`, inline: true }
                                )
                                .setColor('#00FF00');
                            interaction.editReply({ embeds: [embed] });
                        });
                });
            });
    },
};