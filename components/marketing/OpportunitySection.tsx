// SPEC: SPEC-PAGES > Corporate Marketing Page > Opportunity Section
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1 > UI: Opportunity Section

import { Rocket, Users, DollarSign, BookOpen, Headphones, TrendingUp } from "lucide-react";

export function OpportunitySection() {
  const steps = [
    {
      number: "01",
      title: "Sign Up & Get Started",
      description:
        "Create your account in minutes and gain instant access to your personalized business portal and all training materials.",
      icon: Rocket,
    },
    {
      number: "02",
      title: "Build Your Team",
      description:
        "Share your unique link with others and help them discover this opportunity. As your team grows, so does your income potential.",
      icon: Users,
    },
    {
      number: "03",
      title: "Earn & Grow",
      description:
        "Benefit from our proven compensation plan and watch your business expand through our automated placement system.",
      icon: DollarSign,
    },
  ];

  const benefits = [
    {
      icon: BookOpen,
      title: "Comprehensive Training",
      description:
        "Access step-by-step video tutorials, live webinars, and downloadable resources.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description:
        "Get help whenever you need it from our dedicated support team and mentor network.",
    },
    {
      icon: TrendingUp,
      title: "Automated System",
      description:
        "Benefit from our 5×7 forced matrix that helps distribute growth throughout your organization.",
    },
    {
      icon: Users,
      title: "Team Spillover",
      description:
        "Receive additional team members placed under you from your upline's success.",
    },
  ];

  return (
    <section id="opportunity" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Three simple steps to start building your business with Apex Affinity Group
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 mt-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            What You Get
          </h3>
          <p className="text-lg text-gray-600">
            Everything you need to succeed in one powerful platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex items-start space-x-4 bg-gray-50 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
