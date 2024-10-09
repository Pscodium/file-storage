import { apiService, LoginProps } from '@renderer/services/api';
import { useMutation } from 'react-query';

export default function useLogin() {
    const mutate = useMutation({
        mutationFn: ({ email, password }: LoginProps) => apiService.login({ email, password }),
    });

    return mutate;
}
