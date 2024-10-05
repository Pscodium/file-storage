export interface TitleProps {
    children: string;
}

export default function Title({ children }: TitleProps) {
    return (
        <div className="flex text-center justify-center">
            <p className="select-none font-semibold justify-center line-clamp-3 break-words hyphens-auto">
                { children }
            </p>
        </div>
    );
}