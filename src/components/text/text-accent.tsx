import styled from "styled-components";
import { tokens } from "@fluentui/react-theme";

export const TextAccent = ({ children }: { children: React.ReactNode }) => {
    return (
        <Container>
            {children}
        </Container>
    )
}

const Container = styled.div`
    color: ${tokens.colorBrandForeground1};
    font-size: 14px;
    font-weight: 600;
`;