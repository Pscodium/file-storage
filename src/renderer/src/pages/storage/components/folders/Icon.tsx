import { FaArchive } from "react-icons/fa";

export interface ArticleCardProps {
    hex: string;
}

export default function Icon({ hex }: ArticleCardProps) {
    return (
        <div className='flex items-center justify-center'>
            <FaArchive size={30} color={hex}/>
        </div>
    );
}