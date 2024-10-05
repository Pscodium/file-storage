/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { useToast } from "@renderer/components/ui/use-toast";
import useDidMount from "@renderer/hooks/react/useMount";
import { apiService, UserProps, LoginProps } from "@renderer/services/api";
import React, { createContext, useContext, useState } from "react";
import { useLoginDialog } from "./login.dialog";

interface LoginPropsMutation extends LoginProps {}

interface AuthContextProps {
    user: UserProps | null;
    Login: ({ email, password }: LoginPropsMutation) => Promise<boolean>;
    Logout: () => void;
    isLogged: boolean;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProps | null>(null);
    const { toast } = useToast();
    const [logged, setLogged] = useState(false);
    const { closeDialog } = useLoginDialog();


    async function Login({ email, password }: LoginPropsMutation) {
        try {

            const user = await apiService.login({ email, password })
            if (!user) {
                setLogged(false);
                toast({
                    variant: "destructive",
                    title: "Oh damn. An error has occurred",
                    description: "You tried to log in but something shit happened...",
                    className: "outline-none border-none bg-red-600 text-white",
                });
                return false;
            }

            setUser(user.data);
            setLogged(true);
            closeDialog();

            toast({
                variant: "destructive",
                title: "Hell yeah! You are inside me",
                description: "You have successfully logged in you bastard fagot...",
                className: "outline-none border-none bg-green-600 text-white",
            });

            return true;
        } catch (err) {
            setLogged(false);
            console.error(err);

            toast({
                variant: "destructive",
                title: "Oh damn. An error has occurred",
                description: "You tried to log in but something shit happened...",
                className: "outline-none border-none bg-red-600 text-white",
            });

            return false;
        }
    }

    async function Logout() {
        try {
            const logout = await apiService.logout();

            if (logout) {
                setLogged(false);
                toast({
                    variant: "destructive",
                    title: "Bye bye little bitch!!",
                    description: "You just logged out, now go to hell...",
                    className: "outline-none border-none bg-green-600 text-white",
                });
                return logout;
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Oh damn. An error has occurred",
                description: "You tried to log out but something shit happened...",
                className: "outline-none border-none bg-red-600 text-white",
            });
            return false;
        }
    }

    useDidMount(async () => {
        try {
            const loggedUser = await apiService.checkAuth();

            if (!loggedUser) {
                return;
            }

            setUser(loggedUser);
            setLogged(true);
        } catch (err) {
            setUser(null);
            setLogged(false);
        }
    });

    return (
        <AuthContext.Provider
            value={{
                user,
                Login,
                Logout,
                isLogged: logged
            }}
        >
            <>{children}</>
        </AuthContext.Provider>
    );
}

const useAuth = () => {
    const context = useContext(AuthContext);
    return context;
};

export { AuthProvider, useAuth, AuthContext };