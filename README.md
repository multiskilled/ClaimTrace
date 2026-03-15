# Inspiration
Returns fraud costs e-commerce retailers billions of dollars every year. Yet most teams still review claims manually — often evaluating one blurry photo at a time. We asked a simple question: **what if AI could review every piece of evidence simultaneously, the way an experienced investigator would?**

ClaimTrace was built to explore that idea by combining multimodal AI with human oversight, allowing **AI-assisted review with human validation at different stages of the process.**

# What it does
ClaimTrace allows returns and dispute teams to upload claim evidence such as **photos, receipts, and screenshots** and receive an instant AI-driven analysis.

The system provides:
- A **confidence score**
- A **recommended outcome** (Approve / Reject / Escalate)
- A **plain-English explanation** describing exactly why the recommendation was made

This helps teams review claims faster while maintaining transparency in the decision process.

# How we built it
ClaimTrace is built as a modern web application using:

- **React** for the frontend interface  
- **Express.js** for the API layer  
- **PostgreSQL** for storing claim history and analysis results  
- **Amazon S3** for secure evidence storage  
- **Amazon Bedrock – Nova Lite** as the multimodal AI engine  

Nova Lite analyzes multiple evidence images in a single request and returns **structured JSON decisions** containing confidence scores, recommendations, and supporting explanations.

# Challenges we ran into
One challenge was designing **multimodal prompts that consistently returned structured outputs** at scale. Ensuring reliable JSON responses from the model required careful prompt engineering and output validation.

Another challenge involved **handling S3 uploads through the server layer** to avoid browser CORS issues while keeping the workflow secure.

We also worked on optimizing deployment with **Vercel serverless infrastructure**, ensuring the Express API bundled correctly and reducing the size of the index page and supporting packages so the website loads quickly.

# Accomplishments that we're proud of
We successfully built a **production-style AI pipeline** where Nova Lite can review multiple pieces of evidence simultaneously and return actionable recommendations within seconds.

Another accomplishment is the **security-first design**. The application does not store AWS credentials server-side. Credentials remain in the user's environment and can be removed at any time.

# What we learned
One key lesson was that **structured output contracts are critical when working with multimodal AI models**. Defining a strict JSON schema for responses — including confidence, recommendation, flags, and explanation — significantly improved reliability compared to open-ended prompting.

We also gained valuable experience building a **complete end-to-end web application**, from frontend interface to AI pipeline and cloud deployment.

# What's next for ClaimTrace
There are several improvements planned for future iterations:

- **Cross-claim fraud pattern detection** across multiple cases
- **Direct integrations with returns platforms and dispute systems**
- A **customizable rules engine** layered on top of the AI verdict
- **Operational dashboards** showing approval rates and time-to-decision by product category
- Further improvements in **security, user experience, and model confidence validation**

We also plan to continue refining the system based on feedback and expand the platform with additional automation and analytics capabilities.
