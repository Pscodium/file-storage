import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import FloatingLabelInput from '@renderer/components/ui/floating-label';
import { useAuth } from '@renderer/contexts/auth';
import { useLoginDialog } from '@renderer/contexts/login.dialog';

export interface LoginInputProps {
    email: string | undefined;
    password: string | undefined;
}


export default function LoginDialog() {
    const [cantCompleteLogin, setCantCompleteLogin] = useState(false);
    const [completedEmail, setCompletedEmail] = useState(true);
    const [completedPassword, setCompletedPassword] = useState(true);
    const [inputs, setInputs] = useState<LoginInputProps>({
        email: undefined,
        password: undefined,
    });
    const { Login } = useAuth();
    const { setOpen, isOpen } = useLoginDialog();

    function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            onClickSubmit();
        }
    }

    async function onClickSubmit() {
        if (!inputs.email) {
            setCompletedEmail(false);
            return;
        }
        if (!inputs.password) {
            setCompletedPassword(false);
            return;
        }
        if (!inputs.email && !inputs.password) {
            setCantCompleteLogin(true);
            return;
        }

        try {
            const login = await Login({
                email: inputs.email,
                password: inputs.password,
            });
            
            if (!login) {
                return setCantCompleteLogin(true);
            }
            setCantCompleteLogin(false);

            return;
        } catch (err) {
            setCantCompleteLogin(true);
            return;
        }
    }

    useEffect(() => {
        if (inputs.email) {
            setCompletedEmail(true);
        }
        if (inputs.password) {
            setCompletedPassword(true);
        }
        if (inputs.email && inputs.password) {
            setCantCompleteLogin(false);
        }
    }, [inputs]);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent onKeyDown={handleKeyPress} className='bg-white outline-none border-none z-[9999]'>
                <DialogTitle className="text-[24px] text-black">Login</DialogTitle>
                <DialogDescription className="text-[12px] text-black">
                    Realize seu login
                </DialogDescription>
                <div className='flex flex-col gap-4'>
                    <FloatingLabelInput onKeyDown={handleKeyPress} invalid={!completedEmail || cantCompleteLogin} text={inputs.email} onChange={(ev) => setInputs({ ...inputs, email: ev.target.value })} label='E-mail' className='!bg-white' />
                    <FloatingLabelInput onKeyDown={handleKeyPress} invalid={!completedPassword || cantCompleteLogin} text={inputs.password} onChange={(ev) => setInputs({ ...inputs, password: ev.target.value })} label='Password' type='password' security='*' className='!bg-white' />
                </div>
                <div className="flex gap-3">
                    <DialogTrigger>
                        <Button className="rounded-md bg-core-primary text-white hover:bg-forum-navb">
                            Cancel
                        </Button>
                    </DialogTrigger>
                    <Button onClick={onClickSubmit} className="rounded-md bg-core-secondary text-white hover:bg-forum-navb">
                        Login
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}