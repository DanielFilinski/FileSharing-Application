import styled from "styled-components";
import { tokens } from "@fluentui/react-theme";

export const TextRoundAccent = ({ children }: { children: React.ReactNode }) => {
    return (
        <Container>
            {children}
        </Container>
    )
}

const Container = styled.div`
    background-color: ${tokens.colorBrandBackground};
    border-radius: 1rem;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    > * {
        color: white;
    }
`;