# Third-party notices

SkillAtlas includes or adapts the following third-party work:

- Directory data from [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills). The upstream directory declares Apache-2.0; individual linked skills can use different licenses.
- Agent Elements interface source from [21st.dev](https://21st.dev/) and [agent-elements.21st.dev](https://agent-elements.21st.dev/), adapted inside `src/components/agent-elements`.
- ONNX Runtime Web bridge binaries from `onnxruntime-web`, version `1.26.0-dev.20260416-b7804b056c`, self-hosted in `public/onnx`. Its MIT license is included beside the binaries.
- The optional local model is [onnx-community/Qwen3-0.6B-ONNX](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX). Model artifacts are not redistributed in this repository; the browser downloads them only after explicit user consent and the model's upstream license applies.

Package-level licenses for JavaScript dependencies remain available in their respective npm packages and source repositories.
