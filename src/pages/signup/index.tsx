import {
    Box,
    Button,
    Center,
    chakra,
    Container,
    FormControl,
    FormLabel,
    Grid,
    Heading,
    Input,
    Img,
    Spacer,
    useToast,
} from '@chakra-ui/react'
import { FormEvent, useState } from 'react'
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendEmailVerification,
} from 'firebase/auth'
import { FirebaseError } from '@firebase/util'
import { useRouter } from '@src/hooks/useRouter/useRouter'
import { storage } from "@src/lib/firebase/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const Page = () => {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [profileImage, setProfileImage] = useState<File | undefined | null>(null)
    // プロフィール画像のプレビュー用
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const toast = useToast()
    const { push } = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files ? e.target.files[0] : undefined

            if (file) {
                setProfileImage(file)
                setPreviewImageUrl(URL.createObjectURL(file))
            }
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        setIsLoading(true)
        e.preventDefault()
        try {
            const auth = getAuth()
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            )
            await sendEmailVerification(userCredential.user)

            // プロフィール画像を　Firebase Storage　にアップロード
            if (profileImage) {
                const imageRef = ref(storage, `images/${userCredential.user.uid}`)
                await uploadBytes(imageRef, profileImage)
                const profileImageUrl = await getDownloadURL(imageRef)
                console.log("プロフィール画像URL: ", profileImageUrl)
            }
            setEmail('')
            setPassword('')
            toast({
                title: '確認メールを送信しました。',
                status: 'success',
                position: 'top',
            })
            push((path) => path.chat.$url())
        } catch (e) {
            toast({
                title: 'エラーが発生しました。',
                status: 'error',
                position: 'top',
            })
            if (e instanceof FirebaseError) {
                console.log(e)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Container py={14}>
            <Heading>サインアップ</Heading>
            <chakra.form onSubmit={handleSubmit}>
                <Spacer height={8} aria-hidden />
                <Grid gap={4}>
                    <Box display={'contents'}>
                        <FormControl>
                            <FormLabel>メールアドレス</FormLabel>
                            <Input
                                type={'email'}
                                name={'email'}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                }}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>パスワード</FormLabel>
                            <Input
                                type={'password'}
                                name={'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                }}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>プロフィール画像</FormLabel>
                            <Input
                                type={'file'}
                                name={'user_image'}
                                accept=".png,.jpeg,.jpg"
                                onChange={handleFileChange}
                            />
                            {previewImageUrl && (
                                <Box mt={4}>
                                    <Img src={previewImageUrl} alt="プロフィール画像のプレビュー" width="50px" height="50px" objectFit="cover" />
                                </Box>
                            )}
                        </FormControl>
                    </Box>
                </Grid>
                <Spacer height={4} aria-hidden />
                <Center>
                    <Button type={'submit'} isLoading={isLoading}>アカウントを作成</Button>
                </Center>
            </chakra.form>
        </Container>
    )
}

export default Page