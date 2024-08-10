# 🍋 LoRA Metadata Viewer/Editor

This is forked from https://github.com/Xypher7/lora-metadata-viewer 

I added a "Suggested Prompt" section which listed the top 10 tags in a format which can be easily used as a prompt for image generation. 

There is a hardcoded blacklist which filters out words that are likely not required to trigger a Lora's intended image such as "smile" or "open mouth"

---

Single file pure HTML tool for viewing and editing LoRA metadata locally on your web browser without the need of installation or internet connectivity.
## Usage

No need for prior setup, just open the HTML file with the web browser of your choice and drag a Safetensors file. Alternatively, you can use the version hosted on GitHub through the link provided in the demo section.


## Features

- Configurable metadata summary
- CivitAI resource lookup. (Requires internet connection)
- Overview of training tags grouped and sorted by frequency
- Edit or remove metadata in the Safetensors file


## Offline Execution

The tool is designed to be used offline and processing is entirely done on your browser. However, the following features require fetching some resources on the internet and will not work without internet connectivity:
- JSON syntax highlighting (in short: metadata won't be color coded)
- CivitAI resource lookup


## Screenshots

![App Screenshot](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c9d8597c-2443-4432-8dbc-e3969716ef85/original=true/Screenshot%202024-01-10%20035409.jpeg)

![App Screenshot](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2f93dbcd-4044-4f3a-a5f9-15fb03df8ce0/original=true/Screenshot%202024-01-10%20035444.jpeg)
