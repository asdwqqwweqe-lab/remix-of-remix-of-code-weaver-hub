import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Delete, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Login = () => {
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = () => {
    const success = login(pin);
    if (success) {
      toast.success('🎉 مرحباً بك!', {
        description: 'تم تسجيل الدخول بنجاح',
      });
      navigate('/');
    } else {
      setIsShaking(true);
      toast.error('الرقم السري غير صحيح');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              مدونة البرمجة
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              أدخل الرقم السري للمتابعة
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PIN Display */}
          <div 
            className={cn(
              "flex justify-center gap-3 transition-transform",
              isShaking && "animate-shake"
            )}
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={cn(
                  "w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200",
                  pin.length > index
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 bg-muted/50"
                )}
              >
                {pin.length > index ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-14 text-xl font-semibold hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => handleNumberClick(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-14 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
              onClick={handleDelete}
            >
              <Delete className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              className="h-14 text-xl font-semibold hover:bg-primary/10 hover:border-primary transition-all"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              variant="default"
              className="h-14"
              onClick={handleSubmit}
              disabled={pin.length !== 4}
            >
              <Check className="w-6 h-6" />
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              🔒 تسجيل الدخول آمن ومحمي
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
