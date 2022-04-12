import { useState } from "react";
import Card from "../components/Card";
import { styled } from "@mui/material/styles";
import { createStakePool, ACCESS_PROGRAM_ID, StakePool } from "@access";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import { Button } from "@mui/material";
import { sendTx } from "../utils/send";
import { notify } from "../utils/notifications";

const Container = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  flexDirection: "column",
});

const CardContainer = styled("div")({
  height: 300,
});

const InnerCard = styled("div")({
  padding: 10,
  width: 500,
  height: 350,
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  flexDirection: "column",
});

const Link = styled("a")({
  textDecoration: "underline",
  fontWeight: "bold",
  cursor: "pointer",
});

const FormControlStyled = styled(FormControl)({
  width: "90%",
});

const CreatePool = () => {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [minimum, setMinimum] = useState<number>(0);
  const [stakePool, setStakePool] = useState<string | null>(null);

  const handle = async () => {
    if (!publicKey || !minimum) return;
    try {
      setLoading(true);
      const ix = await createStakePool(
        connection,
        publicKey,
        minimum,
        publicKey,
        ACCESS_PROGRAM_ID
      );

      const tx = await sendTx(connection, publicKey, ix, sendTransaction);
      console.log(tx);
      const [key] = await StakePool.getKey(ACCESS_PROGRAM_ID, publicKey);
      setStakePool(key.toBase58());
      notify({ message: `Success creating stake pool ${key.toBase58()}` });
    } catch (err) {
      console.log(err);
      // @ts-ignore
      notify({ message: `Error creating stake pool ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <CardContainer>
        <Card>
          <InnerCard>
            <FormControlStyled>
              <InputLabel>Minimum stake amount</InputLabel>
              <OutlinedInput
                type="number"
                id="component-outlined"
                value={minimum}
                onChange={(e) => setMinimum(parseInt(e.target.value) || 0)}
                label="Minimum stake amount"
              />
            </FormControlStyled>
            <Button disabled={!connected} variant="contained" onClick={handle}>
              {loading ? <CircularProgress color="inherit" /> : "Create"}
            </Button>
            {stakePool && (
              <>
                <span>Stake pool address:</span>
                <Link href={`/stake/${stakePool}`}>{stakePool}</Link>
              </>
            )}
          </InnerCard>
        </Card>
      </CardContainer>
    </Container>
  );
};

export default CreatePool;
