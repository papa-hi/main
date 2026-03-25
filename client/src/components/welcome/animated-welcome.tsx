import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AnimatedWelcomeProps {
  onComplete: () => void;
  userName?: string;
}

export default function AnimatedWelcome({ onComplete, userName }: AnimatedWelcomeProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="text-7xl mb-4">👨‍👧‍👦</div>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">PaPa-Hi!</h1>
          <p className="text-lg text-gray-600">
            {userName
              ? t('welcome.personalGreeting', `Welcome {{name}}! Ready for some dad adventures?`, { name: userName })
              : t('welcome.genericGreeting', 'Welcome to the dad community!')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-3 gap-6 mb-8"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🤝</div>
            <h3 className="font-semibold text-primary mb-1">{t('welcome.feature1Title', 'Connect')}</h3>
            <p className="text-sm text-gray-600">{t('welcome.feature1Desc', 'Meet other dads nearby')}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="font-semibold text-primary mb-1">{t('welcome.feature2Title', 'Plan')}</h3>
            <p className="text-sm text-gray-600">{t('welcome.feature2Desc', 'Organise fun playdates')}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="font-semibold text-primary mb-1">{t('welcome.feature3Title', 'Discover')}</h3>
            <p className="text-sm text-gray-600">{t('welcome.feature3Desc', 'Find family-friendly spots')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onComplete}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 text-lg font-semibold shadow-lg"
          >
            {t('welcome.getStarted', "Let's Start!")} 🚀
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
