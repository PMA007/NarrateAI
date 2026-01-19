
import { Script } from "@/lib/store";

export const DUMMY_PREVIEW_SCRIPT: Script = {
    slides: [
        {
            slide_id: 1,
            title: "Template Preview",
            layout: "text_features",
            narration: "Welcome to the preview. This template supports rich text, charts, and diagrams.",
            content: {
                bullets: [
                    "Cinematic Visuals",
                    "Data Visualization",
                    "Process Flowcharts"
                ]
            },
            duration: 3,
            startTime: 0
        },
        {
            slide_id: 2,
            title: "Data Visualization",
            layout: "chart_bar",
            narration: "Present your data clearly with animated bar charts.",
            content: {
                chart_data: {
                    labels: ["Q1", "Q2", "Q3", "Q4"],
                    values: [30, 50, 80, 60],
                    label: "Growth Metric"
                }
            },
            duration: 3,
            startTime: 3
        },
        {
            slide_id: 3,
            title: "Trend Analysis",
            layout: "chart_line",
            narration: "Showcase trends over time with smooth line graphs.",
            content: {
                chart_data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    values: [20, 35, 30, 50, 45, 70],
                    label: "User Trends"
                }
            },
            duration: 3,
            startTime: 6
        },
        {
            slide_id: 4,
            title: "Process Flows",
            layout: "process_flow",
            narration: "Visualize complex workflows or steps effectively.",
            content: {
                flow_steps: ["Research", "Design", "Development", "Testing", "Launch"]
            },
            duration: 3,
            startTime: 9
        },
        {
            slide_id: 5,
            title: "Conclusion",
            layout: "text_features",
            narration: "End your presentation with a strong summary slide.",
            content: {
                bullets: [
                    "Thank you for watching",
                    "Select this template to begin",
                    "Generate your video instantly"
                ]
            },
            duration: 3,
            startTime: 12
        }
    ]
};

export const DUMMY_RETRO_SCRIPT: Script = {
    template: 'retro',
    slides: [
        {
            slide_id: 1,
            title: "STARTUP PITCH DECK",
            layout: "title",
            content: { bullets: ["Present by Author"] },
            narration: "Welcome to our investor presentation.",
            duration: 5,
            startTime: 0
        },
        {
            slide_id: 2,
            title: "PROBLEM STATEMENT",
            layout: "text_features",
            content: {
                bullets: [
                    "Lack of Brand Differentiation",
                    "Inconsistent Brand Messaging",
                    "Keeping Up with Trends"
                ]
            },
            narration: "Startups face unique challenges in today's market.",
            duration: 5,
            startTime: 5
        },
        {
            slide_id: 3,
            title: "OUR INNOVATIVE SOLUTIONS",
            layout: "columns_3",
            content: {
                bullets: [
                    "Find Unique Point",
                    "Brand Guidelines",
                    "Agile Marketing"
                ]
            },
            narration: "Our solutions directly address these pain points.",
            duration: 5,
            startTime: 10
        },
        {
            slide_id: 4,
            title: "DISCOVER OUR SERVICES",
            layout: "grid_cards",
            content: {
                bullets: [
                    "BRAND BUILDING",
                    "DIGITAL MARKETING",
                    "ANALYTICS",
                    "PR SUPPORT"
                ]
            },
            narration: "We offer a comprehensive suite of services.",
            duration: 5,
            startTime: 15
        },
        {
            slide_id: 5,
            title: "THANK YOU",
            layout: "title",
            content: {
                bullets: []
            },
            narration: "Thank you for watching.",
            duration: 5,
            startTime: 20
        }
    ]
};
