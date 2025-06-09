import styled from "styled-components";
import AccentIcon from "../icon/accent-icon";
import { CardTitle } from "./card-title";

type CardHeaderProps = {
    text: string;
    icon: React.ReactNode;
}

export const CardHeader = ({ text, icon }: CardHeaderProps) => {
    return (
        <Container>
            <AccentIcon icon={icon} />
            <CardTitle text={text} />
        </Container>
    )
}


const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;