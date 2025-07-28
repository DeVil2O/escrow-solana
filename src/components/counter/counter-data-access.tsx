import { getEscrowProgram, getEscrowProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { toast } from 'sonner'
import { BN, web3 } from '@coral-xyz/anchor'

export function useCounterProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getEscrowProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getEscrowProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['escrow', 'all', { cluster }],
    queryFn: () => program.account.escrow.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['escrow', 'initialize', { cluster }],
    mutationFn: (amount: number) => {
      const [escrowPda] = PublicKey.findProgramAddressSync([Buffer.from('escrow')], program.programId)

      return program.methods
        .initialize(new BN(amount))
        .accounts({
          escrow: escrowPda,
          payer: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: async (signature, amount) => {
      transactionToast(signature)
      await accounts.refetch()
    },
    onError: (error, amount) => {
      toast.error(`Failed to initialize account with amount ${amount}`)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useCounterProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCounterProgram()

  const accountQuery = useQuery({
    queryKey: ['escrow', 'fetch', { cluster, account }],
    queryFn: () => program.account.escrow.fetch(account),
  })

  const release = useMutation({
    mutationKey: ['escrow', 'release', { cluster }],
    mutationFn: () => program.methods.release().accounts({ escrow: account }).rpc(),
    onSuccess: async (signature) => {
      transactionToast(signature)
      await accounts.refetch()
    },
    retry: false,
  })

  return {
    accountQuery,
    release,
  }
}
