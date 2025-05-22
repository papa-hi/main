import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AnimatedWelcomeProps {
  onComplete: () => void;
  userName?: string;
}

const characters = [
  {
    id: "papa-bear",
    name: "Papa Bear",
    emoji: "🐻",
    greeting: "welcome.papaBearGreeting",
    description: "welcome.papaBearDesc",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  {
    id: "playground-owl",
    name: "Playground Owl", 
    emoji: "🦉",
    greeting: "welcome.owlGreeting",
    description: "welcome.owlDesc",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    id: "adventure-fox",
    name: "Adventure Fox",
    emoji: "🦊",
    greeting: "welcome.foxGreeting", 
    description: "welcome.foxDesc",
    color: "text-red-500",
    bgColor: "bg-red-100",
  }
];

export default function AnimatedWelcome({ onComplete, userName }: AnimatedWelcomeProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCharacters, setShowCharacters] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(0);

  useEffect(() => {
    // Start the welcome sequence
    const timer1 = setTimeout(() => setShowCharacters(true), 1000);
    
    // Show characters one by one
    const timer2 = setTimeout(() => setCurrentCharacter(1), 3000);
    const timer3 = setTimeout(() => setCurrentCharacter(2), 5000);
    const timer4 = setTimeout(() => setCurrentStep(1), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleSkip = () => {
    onComplete();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Skip Button */}
      <Button
        variant="ghost"
        onClick={handleSkip}
        className="absolute top-6 right-6 text-gray-600 hover:text-gray-800"
      >
        {t('welcome.skip', 'Skip')}
      </Button>

      <div className="text-center max-w-4xl mx-auto px-6">
        {/* Logo and Title */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="text-8xl mb-4">👨‍👧‍👦</div>
          <h1 className="text-5xl font-heading font-bold text-primary mb-2">
            PaPa-Hi!
          </h1>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {userName ? 
              t('welcome.personalGreeting', `Welcome {{name}}! Ready for some dad adventures?`, { name: userName }) :
              t('welcome.genericGreeting', 'Welcome to the dad community!')
            }
          </motion.p>
        </motion.div>

        {/* Character Introductions */}
        <AnimatePresence>
          {showCharacters && currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-heading font-semibold mb-6 text-gray-800">
                {t('welcome.meetHelpers', 'Meet your adventure helpers!')}
              </h2>
              
              <div className="flex justify-center items-center gap-8 flex-wrap">
                {characters.map((character, index) => (
                  <motion.div
                    key={character.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: index <= currentCharacter ? 1 : 0.3,
                      opacity: index <= currentCharacter ? 1 : 0.3
                    }}
                    transition={{ 
                      delay: index * 2,
                      duration: 0.8,
                      type: "spring",
                      stiffness: 100
                    }}
                    className={`${character.bgColor} rounded-2xl p-6 max-w-xs text-center relative ${
                      index <= currentCharacter ? 'shadow-lg' : ''
                    }`}
                  >
                    {/* Character Animation */}
                    <motion.div
                      animate={index <= currentCharacter ? {
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      className="text-6xl mb-3"
                    >
                      {character.emoji}
                    </motion.div>
                    
                    <h3 className={`text-lg font-semibold ${character.color} mb-2`}>
                      {t(`welcome.${character.id}Name`, character.name)}
                    </h3>
                    
                    {index <= currentCharacter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <p className="text-sm text-gray-600 mb-2">
                          {t(character.greeting, `Hi there! I'm ${character.name}`)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t(character.description, "I'll help you on your adventures!")}
                        </p>
                      </motion.div>
                    )}

                    {/* Sparkle Animation */}
                    {index <= currentCharacter && (
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, 180, 360]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 4
                        }}
                      >
                        ✨
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Get Started Section */}
        <AnimatePresence>
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <motion.h2 
                className="text-3xl font-heading font-bold text-primary mb-4"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(255,165,0,0.5)",
                    "0 0 20px rgba(255,165,0,0.8)",
                    "0 0 0px rgba(255,165,0,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t('welcome.readyTitle', "You're all set!")}
              </motion.h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('welcome.readyDescription', 'Connect with other dads, plan amazing playdates, and discover the best family-friendly spots in your area!')}
              </p>

              {/* Feature highlights with icons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">🤝</div>
                  <h3 className="font-semibold text-primary mb-1">
                    {t('welcome.feature1Title', 'Connect')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('welcome.feature1Desc', 'Meet other dads in your neighborhood')}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">📅</div>
                  <h3 className="font-semibold text-primary mb-1">
                    {t('welcome.feature2Title', 'Plan')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('welcome.feature2Desc', 'Organize fun playdates for kids')}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="font-semibold text-primary mb-1">
                    {t('welcome.feature3Title', 'Discover')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('welcome.feature3Desc', 'Find amazing places for families')}
                  </p>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t('welcome.getStarted', "Let's Start the Adventure!")} 🚀
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
              rotate: 360,
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            {['🎈', '⭐', '🎨', '🏀', '🚀', '🎪'][i]}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}