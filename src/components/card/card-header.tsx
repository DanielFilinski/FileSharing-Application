import styled from "styled-components";
import AccentIcon from "../icon/accent-icon";
import { CardTitle } from "./card-title";
import { Body1 } from "@fluentui/react-components";

type CardHeaderProps = {
    text: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export const CardHeader = ({ text, subtitle, icon }: CardHeaderProps) => {
    return (
        <Container>
            {icon && <AccentIcon icon={icon} />}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <CardTitle text={text} />
                {subtitle && <Body1>{subtitle}</Body1>}
            </div>
            
        </Container>
    )
}


const Container = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
`;