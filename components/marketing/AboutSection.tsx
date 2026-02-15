// SPEC: SPEC-PAGES > Corporate Marketing Page > About Section
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1 > UI: About Section

"use client";

import { useEffect, useRef, useState } from "react";
import { Target, Users, TrendingUp, Award } from "lucide-react";

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function Counter({ end, duration = 2000, suffix = "" }: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <div ref={ref} className="text-5xl font-bold text-blue-600">
      {count}
      {suffix}
    </div>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Apex Affinity Group
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            We're a community-driven organization dedicated to empowering individuals
            to achieve financial independence through proven business systems,
            comprehensive training, and unwavering support.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <Counter end={1000} suffix="+" />
            <div className="text-gray-600 mt-2">Active Distributors</div>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <Counter end={50} suffix="+" />
            <div className="text-gray-600 mt-2">Countries</div>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <Counter end={95} suffix="%" />
            <div className="text-gray-600 mt-2">Satisfaction Rate</div>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <Counter end={24} suffix="/7" />
            <div className="text-gray-600 mt-2">Support Available</div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Clear Mission</h3>
            <p className="text-gray-600">
              Empowering individuals to build sustainable income streams
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Strong Community</h3>
            <p className="text-gray-600">
              A supportive network of like-minded entrepreneurs
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Proven Growth</h3>
            <p className="text-gray-600">
              Systems and strategies that deliver real results
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Excellence</h3>
            <p className="text-gray-600">
              Committed to the highest standards in everything we do
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
