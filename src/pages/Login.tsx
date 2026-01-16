import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
    const [pin, setPin] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handlePinChange = (value: string) => {
        // Only allow numbers and max 4 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 4);
        setPin(numericValue);

        // Auto-submit when 4 digits are entered
        if (numericValue.length === 4) {
            handleLogin(numericValue);
        }
    };

    const handleLogin = (pinToCheck: string = pin) => {
        const success = login(pinToCheck);

        if (success) {
            toast.success('🎉 مرحباً بك!', {
                description: 'تم تسجيل الدخول بنجاح',
            });
            navigate('/');
        } else {
            setIsShaking(true);
            setPin('');
            toast.error('رقم سري خاطئ', {
                description: 'حاول مرة أخرى',
            });

            setTimeout(() => setIsShaking(false), 500);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length === 4) {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
            <Card
                className={`w-full max-w-md shadow-2xl ${isShaking ? 'animate-shake' : ''}`}
                style={{
                    animation: isShaking ? 'shake 0.5s' : 'none'
                }}
            >
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            مدونة البرمجة
                        </CardTitle>
                        <CardDescription className="text-lg mt-2 flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            أدخل الرقم السري للدخول
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="text-center text-2xl tracking-[0.5em] font-bold h-16 text-primary"
                            maxLength={4}
                            autoFocus
                            dir="ltr"
                        />
                        <p className="text-sm text-muted-foreground text-center">
                            {pin.length}/4 أرقام
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '✓'].map((num) => (
                            <Button
                                key={num}
                                variant={num === '✓' ? 'default' : 'outline'}
                                size="lg"
                                className="h-14 text-xl font-semibold"
                                onClick={() => {
                                    if (num === '←') {
                                        setPin(pin.slice(0, -1));
                                    } else if (num === '✓') {
                                        if (pin.length === 4) handleLogin();
                                    } else {
                                        if (pin.length < 4) {
                                            const newPin = pin + num;
                                            setPin(newPin);
                                            if (newPin.length === 4) {
                                                setTimeout(() => handleLogin(newPin), 100);
                                            }
                                        }
                                    }
                                }}
                                disabled={num === '✓' && pin.length !== 4}
                            >
                                {num}
                            </Button>
                        ))}
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-xs text-center text-muted-foreground">
                            💡 سيتم تسجيل أول دخول في قاعدة البيانات
                        </p>
                    </div>
                </CardContent>
            </Card>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
        </div>
    );
};

export default Login;
